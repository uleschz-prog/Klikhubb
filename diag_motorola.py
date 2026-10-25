#!/usr/bin/env python3
"""Diagnóstico ADB/fastboot para Motorola Moto G24.

Lee estado de conexión, IMEI, propiedades de red y bloqueo del bootloader.
No modifica el dispositivo: no desbloquea SIM, NV ni bootloader.

El cambio de operador (por ejemplo AT&T → Virgin) se gestiona con el IMEI
ante el operador original, no con este script.
"""

from __future__ import annotations

import argparse
import re
import shutil
import subprocess
import sys
from dataclasses import dataclass, field
from typing import Mapping, Sequence

DEVICE_HINT = "Motorola Moto G24"
ADB_MISSING_MSG = (
    "ADB no está en el PATH. Instala Android Platform Tools y vuelve a intentar.\n"
    "  macOS/Linux: https://developer.android.com/tools/releases/platform-tools\n"
    "  Asegúrate de que el directorio `platform-tools` esté en tu PATH."
)
FASTBOOT_MISSING_MSG = (
    "fastboot no está en el PATH. Se omitirá `fastboot getvar all`.\n"
    "Instala Android Platform Tools para consultar el bootloader en modo fastboot."
)

IMEI_SHELL_COMMANDS: tuple[tuple[str, ...], ...] = (
    ("service", "call", "iphonesubinfo", "1"),
    ("service", "call", "iphonesubinfo", "1", "s16", "com.android.shell"),
    ("service", "call", "iphonesubinfo", "1", "i32", "0"),
)


class ToolNotFoundError(RuntimeError):
    """adb o fastboot no están instalados o no están en el PATH."""


class DeviceNotFoundError(RuntimeError):
    """No hay un dispositivo ADB o fastboot listo."""


@dataclass
class CommandResult:
    stdout: str
    stderr: str
    returncode: int


@dataclass
class DiagnosticReport:
    serial: str | None = None
    adb_connected: bool = False
    fastboot_connected: bool = False
    model: str = ""
    manufacturer: str = ""
    imei: str = ""
    imei_raw: str = ""
    carrier: str = ""
    sim_operator_numeric: str = ""
    sim_operator_alpha: str = ""
    bootloader_state: str = "DESCONOCIDO"
    bootloader_detail: str = ""
    oem_unlock_allowed: str = ""
    verified_boot: str = ""
    flash_locked: str = ""
    vbmeta_state: str = ""
    fastboot_vars: dict[str, str] = field(default_factory=dict)
    errors: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)
    props: dict[str, str] = field(default_factory=dict)


class CommandRunner:
    """Ejecuta adb/fastboot. Permite inyectar un ejecutor en pruebas."""

    def __init__(
        self,
        *,
        adb_path: str | None = None,
        fastboot_path: str | None = None,
        execute=None,
        timeout: float = 20.0,
    ) -> None:
        self.adb_path = adb_path
        self.fastboot_path = fastboot_path
        self._execute = execute or _default_execute
        self.timeout = timeout

    def resolve_adb(self) -> str:
        path = self.adb_path if self.adb_path is not None else shutil.which("adb")
        if not path:
            raise ToolNotFoundError(ADB_MISSING_MSG)
        return path

    def resolve_fastboot(self) -> str | None:
        path = (
            self.fastboot_path
            if self.fastboot_path is not None
            else shutil.which("fastboot")
        )
        return path or None

    def run(self, argv: Sequence[str]) -> CommandResult:
        try:
            return self._execute(list(argv), self.timeout)
        except FileNotFoundError as exc:
            missing = argv[0] if argv else "comando"
            raise ToolNotFoundError(
                f"No se encontró `{missing}` en el PATH. {ADB_MISSING_MSG}"
            ) from exc


def _default_execute(argv: Sequence[str], timeout: float) -> CommandResult:
    completed = subprocess.run(
        list(argv),
        capture_output=True,
        text=True,
        timeout=timeout,
        check=False,
    )
    return CommandResult(
        stdout=completed.stdout or "",
        stderr=completed.stderr or "",
        returncode=completed.returncode,
    )


def parse_adb_devices(output: str) -> list[tuple[str, str]]:
    """Devuelve pares (serial, estado) de `adb devices`."""
    devices: list[tuple[str, str]] = []
    for line in output.splitlines():
        line = line.strip()
        if not line or line.startswith("List of devices"):
            continue
        parts = line.split()
        if len(parts) >= 2:
            devices.append((parts[0], parts[1]))
    return devices


def parse_fastboot_devices(output: str) -> list[str]:
    serials: list[str] = []
    for line in output.splitlines():
        line = line.strip()
        if not line:
            continue
        parts = line.split()
        if parts:
            serials.append(parts[0])
    return serials


def parse_service_call_imei(raw: str) -> str:
    """Extrae dígitos IMEI del dump Parcel de `service call iphonesubinfo`."""
    quoted = re.findall(r"'([^']*)'", raw)
    joined = "".join(quoted).replace(".", "").replace(" ", "")
    digits = "".join(ch for ch in joined if ch.isdigit())
    if len(digits) >= 15:
        return digits[:15]
    return digits


def parse_fastboot_getvar_all(raw: str) -> dict[str, str]:
    """Parsea `fastboot getvar all` (líneas `(bootloader) key: value`)."""
    values: dict[str, str] = {}
    for line in raw.splitlines():
        cleaned = re.sub(r"^\(bootloader\)\s*", "", line.strip(), flags=re.IGNORECASE)
        if ":" not in cleaned:
            continue
        key, _, value = cleaned.partition(":")
        key = key.strip().lower()
        value = value.strip()
        if key and key not in {"all"}:
            values[key] = value
    return values


def interpret_bootloader(
    props: Mapping[str, str],
    fastboot_vars: Mapping[str, str],
) -> tuple[str, str]:
    """Clasifica el bootloader como BLOQUEADO, DESBLOQUEADO o DESCONOCIDO."""
    clues: list[str] = []
    unlocked: bool | None = None

    fb_unlocked = (fastboot_vars.get("unlocked") or "").strip().lower()
    if fb_unlocked in {"yes", "true", "1"}:
        unlocked = True
        clues.append("fastboot unlocked=yes")
    elif fb_unlocked in {"no", "false", "0"}:
        unlocked = False
        clues.append("fastboot unlocked=no")

    securestate = (fastboot_vars.get("securestate") or "").strip().lower()
    if securestate in {"unlocked", "unlock"}:
        unlocked = True if unlocked is None else unlocked
        clues.append(f"fastboot securestate={securestate}")
    elif securestate in {"locked", "lock", "secure"}:
        unlocked = False if unlocked is None else unlocked
        clues.append(f"fastboot securestate={securestate}")

    flash_locked = (props.get("ro.boot.flash.locked") or "").strip()
    if flash_locked == "0":
        unlocked = True if unlocked is None else unlocked
        clues.append("ro.boot.flash.locked=0")
    elif flash_locked == "1":
        unlocked = False if unlocked is None else unlocked
        clues.append("ro.boot.flash.locked=1")

    vbmeta = (props.get("ro.boot.vbmeta.device_state") or "").strip().lower()
    if vbmeta == "unlocked":
        unlocked = True if unlocked is None else unlocked
        clues.append("vbmeta=unlocked")
    elif vbmeta == "locked":
        unlocked = False if unlocked is None else unlocked
        clues.append("vbmeta=locked")

    if unlocked is True:
        return "DESBLOQUEADO", "; ".join(clues) or "indicadores de desbloqueo presentes"
    if unlocked is False:
        return "BLOQUEADO", "; ".join(clues) or "indicadores de bloqueo presentes"
    return "DESCONOCIDO", "no se obtuvo unlocked/securestate ni propiedades de bloqueo"


def _try_adbutils_serials() -> list[str] | None:
    try:
        import adbutils  # type: ignore
    except ImportError:
        return None
    try:
        client = adbutils.AdbClient()
        return [device.serial for device in client.device_list()]
    except Exception:
        return None


def list_adb_devices(runner: CommandRunner) -> list[tuple[str, str]]:
    adb = runner.resolve_adb()
    result = runner.run([adb, "devices"])
    return parse_adb_devices(result.stdout + "\n" + result.stderr)


def list_fastboot_devices(runner: CommandRunner) -> list[str]:
    fastboot = runner.resolve_fastboot()
    if not fastboot:
        return []
    result = runner.run([fastboot, "devices"])
    return parse_fastboot_devices(result.stdout + "\n" + result.stderr)


def pick_serial(
    devices: Sequence[tuple[str, str]],
    *,
    requested: str | None,
) -> tuple[str, str]:
    ready = [(serial, state) for serial, state in devices if state == "device"]
    if requested:
        for serial, state in devices:
            if serial == requested:
                if state != "device":
                    raise DeviceNotFoundError(
                        f"El dispositivo `{requested}` está en estado `{state}`, no `device`."
                    )
                return serial, state
        raise DeviceNotFoundError(f"No aparece el serial `{requested}` en `adb devices`.")
    if not ready:
        if devices:
            listing = ", ".join(f"{s} ({st})" for s, st in devices)
            raise DeviceNotFoundError(
                f"No hay un dispositivo ADB autorizado. Conectados: {listing}. "
                "Activa depuración USB y acepta el diálogo RSA."
            )
        raise DeviceNotFoundError(
            "No hay ningún dispositivo ADB conectado. "
            "Conecta el Moto G24 por USB, activa Depuración USB y vuelve a ejecutar."
        )
    if len(ready) > 1:
        serials = ", ".join(s for s, _ in ready)
        raise DeviceNotFoundError(
            f"Hay varios dispositivos ADB ({serials}). Pasa --serial <id>."
        )
    return ready[0]


def adb_shell(runner: CommandRunner, serial: str, args: Sequence[str]) -> CommandResult:
    adb = runner.resolve_adb()
    return runner.run([adb, "-s", serial, "shell", *args])


def getprop(runner: CommandRunner, serial: str, name: str) -> str:
    result = adb_shell(runner, serial, ("getprop", name))
    return (result.stdout or "").strip()


def collect_props(runner: CommandRunner, serial: str, names: Sequence[str]) -> dict[str, str]:
    props: dict[str, str] = {}
    for name in names:
        try:
            props[name] = getprop(runner, serial, name)
        except Exception as exc:  # pragma: no cover - se registra en el reporte
            props[name] = ""
            _ = exc
    return props


def fetch_imei(runner: CommandRunner, serial: str) -> tuple[str, str]:
    last_raw = ""
    for command in IMEI_SHELL_COMMANDS:
        result = adb_shell(runner, serial, command)
        raw = (result.stdout or "") + (result.stderr or "")
        last_raw = raw
        imei = parse_service_call_imei(raw)
        if len(imei) >= 14:
            return imei, raw
    return "", last_raw


def fetch_fastboot_vars(
    runner: CommandRunner,
    *,
    serial: str | None,
) -> tuple[dict[str, str], str]:
    fastboot = runner.resolve_fastboot()
    if not fastboot:
        return {}, FASTBOOT_MISSING_MSG
    argv = [fastboot]
    if serial:
        argv.extend(["-s", serial])
    argv.extend(["getvar", "all"])
    result = runner.run(argv)
    raw = (result.stdout or "") + "\n" + (result.stderr or "")
    # fastboot imprime getvar all en stderr en muchas versiones
    return parse_fastboot_getvar_all(raw), raw


def diagnose(runner: CommandRunner, *, serial: str | None = None) -> DiagnosticReport:
    report = DiagnosticReport()

    try:
        runner.resolve_adb()
    except ToolNotFoundError as exc:
        report.errors.append(str(exc))
        return report

    adbutils_serials = _try_adbutils_serials()
    if adbutils_serials:
        report.warnings.append(
            f"adbutils detectó {len(adbutils_serials)} dispositivo(s): "
            + ", ".join(adbutils_serials)
        )

    try:
        adb_devices = list_adb_devices(runner)
    except ToolNotFoundError as exc:
        report.errors.append(str(exc))
        return report

    fastboot_serials: list[str] = []
    try:
        fastboot_serials = list_fastboot_devices(runner)
    except ToolNotFoundError:
        fastboot_serials = []
    except Exception as exc:
        report.warnings.append(f"No se pudo listar dispositivos fastboot: {exc}")

    report.fastboot_connected = bool(fastboot_serials)

    adb_serial: str | None = None
    try:
        adb_serial, _state = pick_serial(adb_devices, requested=serial)
        report.serial = adb_serial
        report.adb_connected = True
    except DeviceNotFoundError as exc:
        if fastboot_serials:
            report.serial = serial if serial in fastboot_serials else fastboot_serials[0]
            report.warnings.append(str(exc))
        else:
            report.errors.append(str(exc))
            return report

    if adb_serial:
        prop_names = (
            "ro.product.model",
            "ro.product.manufacturer",
            "ro.product.device",
            "ro.carrier",
            "gsm.sim.operator.numeric",
            "gsm.sim.operator.alpha",
            "gsm.operator.numeric",
            "ro.boot.flash.locked",
            "ro.boot.vbmeta.device_state",
            "ro.boot.verifiedbootstate",
            "sys.oem_unlock_allowed",
            "ro.oem_unlock_supported",
            "ro.bootloader",
        )
        report.props = collect_props(runner, adb_serial, prop_names)
        report.model = report.props.get("ro.product.model") or DEVICE_HINT
        report.manufacturer = report.props.get("ro.product.manufacturer") or ""
        report.carrier = report.props.get("ro.carrier") or ""
        report.sim_operator_numeric = report.props.get("gsm.sim.operator.numeric") or ""
        report.sim_operator_alpha = report.props.get("gsm.sim.operator.alpha") or ""
        report.flash_locked = report.props.get("ro.boot.flash.locked") or ""
        report.vbmeta_state = report.props.get("ro.boot.vbmeta.device_state") or ""
        report.verified_boot = report.props.get("ro.boot.verifiedbootstate") or ""
        report.oem_unlock_allowed = report.props.get("sys.oem_unlock_allowed") or ""

        try:
            imei, raw = fetch_imei(runner, adb_serial)
            report.imei = imei
            report.imei_raw = raw.strip()
            if not imei:
                report.warnings.append(
                    "No se pudo parsear el IMEI de `service call iphonesubinfo 1`. "
                    "Revisa permisos ADB o el nivel de Android."
                )
        except Exception as exc:
            report.warnings.append(f"Error al leer IMEI: {exc}")

    fb_serial = None
    if serial and serial in fastboot_serials:
        fb_serial = serial
    elif len(fastboot_serials) == 1:
        fb_serial = fastboot_serials[0]
    elif fastboot_serials and adb_serial and adb_serial in fastboot_serials:
        fb_serial = adb_serial

    if fastboot_serials or runner.resolve_fastboot():
        if fastboot_serials:
            try:
                report.fastboot_vars, _raw = fetch_fastboot_vars(runner, serial=fb_serial)
                if not report.fastboot_vars:
                    report.warnings.append(
                        "`fastboot getvar all` no devolvió variables reconocibles."
                    )
            except ToolNotFoundError as exc:
                report.warnings.append(str(exc))
            except Exception as exc:
                report.warnings.append(f"Error en fastboot getvar all: {exc}")
        else:
            report.warnings.append(
                "El teléfono no está en modo fastboot. "
                "El estado del bootloader se infiere de getprop. "
                "Para `fastboot getvar all`, reinicia a bootloader manualmente "
                "(apagado + vol- abajo, o `adb reboot bootloader`) y vuelve a ejecutar."
            )
    else:
        report.warnings.append(FASTBOOT_MISSING_MSG)

    report.bootloader_state, report.bootloader_detail = interpret_bootloader(
        report.props, report.fastboot_vars
    )
    return report


def format_report(report: DiagnosticReport) -> str:
    lines = [
        "=" * 64,
        f"  REPORTE DE DIAGNÓSTICO — {DEVICE_HINT}",
        "=" * 64,
    ]

    if report.errors and not report.adb_connected and not report.fastboot_connected:
        lines.append("  Estado:           ERROR")
        for err in report.errors:
            for piece in err.splitlines():
                lines.append(f"  {piece}")
        lines.append("=" * 64)
        return "\n".join(lines)

    connected = "sí (ADB)" if report.adb_connected else "no (ADB)"
    if report.fastboot_connected:
        connected += " + fastboot"

    boot_label = {
        "BLOQUEADO": "BLOQUEADO",
        "DESBLOQUEADO": "DESBLOQUEADO",
        "DESCONOCIDO": "DESCONOCIDO (no se pudo determinar)",
    }.get(report.bootloader_state, report.bootloader_state)

    rows = [
        ("Dispositivo", report.serial or "—"),
        ("Conectado", connected),
        ("Fabricante", report.manufacturer or "—"),
        ("Modelo", report.model or DEVICE_HINT),
        ("IMEI", report.imei or "no disponible"),
        ("ro.carrier", report.carrier or "—"),
        ("gsm.sim.operator.numeric", report.sim_operator_numeric or "—"),
        ("Operador SIM (alpha)", report.sim_operator_alpha or "—"),
        ("Bootloader", boot_label),
        ("Detalle bootloader", report.bootloader_detail or "—"),
        ("ro.boot.flash.locked", report.flash_locked or "—"),
        ("vbmeta.device_state", report.vbmeta_state or "—"),
        ("verifiedbootstate", report.verified_boot or "—"),
        ("OEM unlock allowed", report.oem_unlock_allowed or "—"),
    ]
    width = max(len(label) for label, _ in rows)
    for label, value in rows:
        lines.append(f"  {label:<{width}}  {value}")

    if report.fastboot_vars:
        interesting = (
            "unlocked",
            "securestate",
            "version-bootloader",
            "product",
            "serialno",
            "secure",
            "slot-count",
        )
        lines.append("-" * 64)
        lines.append("  Variables fastboot (extracto):")
        for key in interesting:
            if key in report.fastboot_vars:
                lines.append(f"    {key}: {report.fastboot_vars[key]}")

    if report.warnings:
        lines.append("-" * 64)
        lines.append("  Avisos:")
        for warning in report.warnings:
            lines.append(f"    - {warning}")

    if report.errors:
        lines.append("-" * 64)
        lines.append("  Errores:")
        for err in report.errors:
            lines.append(f"    - {err}")

    lines.extend(
        [
            "-" * 64,
            "  Nota: el bloqueo de SIM/operador es independiente del bootloader.",
            "  Este script no libera la red. Para usar Virgin en un equipo AT&T",
            "  solicita el desbloqueo por IMEI al operador original cuando el",
            "  aparato sea elegible (contrato / política de desbloqueo).",
            "=" * 64,
        ]
    )
    return "\n".join(lines)


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description=(
            "Diagnóstico ADB del Motorola Moto G24: conexión, IMEI, red y bootloader."
        )
    )
    parser.add_argument(
        "--serial",
        help="Serial ADB/fastboot si hay más de un dispositivo.",
    )
    parser.add_argument(
        "--adb",
        dest="adb_path",
        help="Ruta absoluta a adb (si no está en el PATH).",
    )
    parser.add_argument(
        "--fastboot",
        dest="fastboot_path",
        help="Ruta absoluta a fastboot.",
    )
    return parser


def main(argv: Sequence[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    runner = CommandRunner(adb_path=args.adb_path, fastboot_path=args.fastboot_path)
    try:
        report = diagnose(runner, serial=args.serial)
    except ToolNotFoundError as exc:
        print(str(exc), file=sys.stderr)
        return 2
    except subprocess.TimeoutExpired:
        print("Tiempo de espera agotado al hablar con adb/fastboot.", file=sys.stderr)
        return 3

    print(format_report(report))
    if report.errors:
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
