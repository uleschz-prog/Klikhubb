#!/usr/bin/env python3
"""Pruebas unitarias de diag_motorola.py (sin hardware)."""

from __future__ import annotations

import unittest
from typing import Sequence

import diag_motorola as diag


PARCEL_IMEI = """
Result: Parcel(
  0x00000000: 00000000 0000000f 00350033 00340035 '........3.5.4.5.'
  0x00000010: 00300031 00340032 00360035 00390038 '1.0.2.4.5.6.8.9.'
  0x00000020: 00300031 00000031                   '1.0.1...        '
)
"""

FASTBOOT_LOCKED = """
(bootloader) version: 0.5
(bootloader) unlocked: no
(bootloader) securestate: locked
(bootloader) product: fogos
(bootloader) serialno: ZY22ABC123
(bootloader) version-bootloader: MBM-3.0
all: Done!
"""

FASTBOOT_UNLOCKED = """
(bootloader) unlocked: yes
(bootloader) securestate: unlocked
(bootloader) product: fogos
"""

ADB_DEVICES_NONE = "List of devices attached\n\n"
ADB_DEVICES_ONE = "List of devices attached\nZY22ABC123\tdevice\n"
ADB_DEVICES_UNAUTHORIZED = "List of devices attached\nZY22ABC123\tunauthorized\n"
ADB_DEVICES_TWO = (
    "List of devices attached\nZY22ABC123\tdevice\nZY99OTHER\tdevice\n"
)


class FakeExecute:
    def __init__(self, mapping: dict[tuple[str, ...], diag.CommandResult]) -> None:
        self.mapping = mapping
        self.calls: list[list[str]] = []

    def __call__(self, argv: Sequence[str], timeout: float) -> diag.CommandResult:
        self.calls.append(list(argv))
        key = tuple(argv)
        if key in self.mapping:
            return self.mapping[key]
        # Coincide ignorando la ruta del binario (primer argumento).
        tail = tuple(argv[1:])
        for stored, result in self.mapping.items():
            if stored[1:] == tail or stored == tail:
                return result
        raise AssertionError(f"comando no mockeado: {argv} timeout={timeout}")


def result(stdout: str = "", stderr: str = "", returncode: int = 0) -> diag.CommandResult:
    return diag.CommandResult(stdout=stdout, stderr=stderr, returncode=returncode)


def prop_ok(value: str) -> diag.CommandResult:
    return result(stdout=value + "\n")


class ParseTests(unittest.TestCase):
    def test_parse_imei_from_parcel(self) -> None:
        imei = diag.parse_service_call_imei(PARCEL_IMEI)
        self.assertEqual(imei, "354510245689101")

    def test_parse_imei_empty(self) -> None:
        self.assertEqual(diag.parse_service_call_imei("Result: Parcel(null)"), "")

    def test_parse_adb_devices(self) -> None:
        devices = diag.parse_adb_devices(ADB_DEVICES_ONE)
        self.assertEqual(devices, [("ZY22ABC123", "device")])

    def test_parse_fastboot_getvar_all(self) -> None:
        values = diag.parse_fastboot_getvar_all(FASTBOOT_LOCKED)
        self.assertEqual(values["unlocked"], "no")
        self.assertEqual(values["securestate"], "locked")
        self.assertEqual(values["product"], "fogos")
        self.assertNotIn("all", values)

    def test_interpret_bootloader_fastboot_locked(self) -> None:
        state, detail = diag.interpret_bootloader({}, {"unlocked": "no"})
        self.assertEqual(state, "BLOQUEADO")
        self.assertIn("unlocked=no", detail)

    def test_interpret_bootloader_fastboot_unlocked(self) -> None:
        state, _detail = diag.interpret_bootloader({}, {"unlocked": "yes"})
        self.assertEqual(state, "DESBLOQUEADO")

    def test_interpret_bootloader_from_getprop(self) -> None:
        state, _detail = diag.interpret_bootloader(
            {"ro.boot.flash.locked": "1", "ro.boot.vbmeta.device_state": "locked"},
            {},
        )
        self.assertEqual(state, "BLOQUEADO")

    def test_interpret_bootloader_unknown(self) -> None:
        state, _detail = diag.interpret_bootloader({}, {})
        self.assertEqual(state, "DESCONOCIDO")


class RunnerTests(unittest.TestCase):
    def test_adb_missing_raises(self) -> None:
        runner = diag.CommandRunner(adb_path="", fastboot_path="")
        with self.assertRaises(diag.ToolNotFoundError) as ctx:
            runner.resolve_adb()
        self.assertIn("PATH", str(ctx.exception))

    def test_file_not_found_becomes_tool_error(self) -> None:
        def boom(argv, timeout):
            raise FileNotFoundError(argv[0])

        runner = diag.CommandRunner(adb_path="/no/such/adb", execute=boom)
        with self.assertRaises(diag.ToolNotFoundError) as ctx:
            runner.run(["/no/such/adb", "devices"])
        self.assertIn("PATH", str(ctx.exception))


class DiagnoseTests(unittest.TestCase):
    def _props(self) -> dict[tuple[str, ...], diag.CommandResult]:
        props = {
            "ro.product.model": "moto g24",
            "ro.product.manufacturer": "motorola",
            "ro.product.device": "fogos",
            "ro.carrier": "attmx",
            "gsm.sim.operator.numeric": "334050",
            "gsm.sim.operator.alpha": "AT&T",
            "gsm.operator.numeric": "334050",
            "ro.boot.flash.locked": "1",
            "ro.boot.vbmeta.device_state": "locked",
            "ro.boot.verifiedbootstate": "green",
            "sys.oem_unlock_allowed": "0",
            "ro.oem_unlock_supported": "1",
            "ro.bootloader": "c2vls-0.1",
        }
        mapping: dict[tuple[str, ...], diag.CommandResult] = {
            ("adb", "devices"): result(ADB_DEVICES_ONE),
            ("fastboot", "devices"): result(""),
        }
        for name, value in props.items():
            mapping[("adb", "-s", "ZY22ABC123", "shell", "getprop", name)] = prop_ok(value)
        mapping[
            ("adb", "-s", "ZY22ABC123", "shell", "service", "call", "iphonesubinfo", "1")
        ] = result(PARCEL_IMEI)
        return mapping

    def test_diagnose_connected_locked_att(self) -> None:
        fake = FakeExecute(self._props())
        runner = diag.CommandRunner(
            adb_path="adb",
            fastboot_path="fastboot",
            execute=fake,
        )
        report = diag.diagnose(runner)
        self.assertTrue(report.adb_connected)
        self.assertEqual(report.serial, "ZY22ABC123")
        self.assertEqual(report.imei, "354510245689101")
        self.assertEqual(report.carrier, "attmx")
        self.assertEqual(report.sim_operator_numeric, "334050")
        self.assertEqual(report.bootloader_state, "BLOQUEADO")
        text = diag.format_report(report)
        self.assertIn("BLOQUEADO", text)
        self.assertIn("354510245689101", text)
        self.assertIn("attmx", text)

    def test_diagnose_no_device(self) -> None:
        fake = FakeExecute(
            {
                ("adb", "devices"): result(ADB_DEVICES_NONE),
                ("fastboot", "devices"): result(""),
            }
        )
        runner = diag.CommandRunner(
            adb_path="adb", fastboot_path="fastboot", execute=fake
        )
        report = diag.diagnose(runner)
        self.assertFalse(report.adb_connected)
        self.assertTrue(report.errors)
        self.assertIn("No hay ningún dispositivo ADB", report.errors[0])

    def test_diagnose_unauthorized(self) -> None:
        fake = FakeExecute(
            {
                ("adb", "devices"): result(ADB_DEVICES_UNAUTHORIZED),
                ("fastboot", "devices"): result(""),
            }
        )
        runner = diag.CommandRunner(
            adb_path="adb", fastboot_path="fastboot", execute=fake
        )
        report = diag.diagnose(runner)
        self.assertIn("unauthorized", report.errors[0])

    def test_diagnose_multiple_requires_serial(self) -> None:
        fake = FakeExecute(
            {
                ("adb", "devices"): result(ADB_DEVICES_TWO),
                ("fastboot", "devices"): result(""),
            }
        )
        runner = diag.CommandRunner(
            adb_path="adb", fastboot_path="fastboot", execute=fake
        )
        report = diag.diagnose(runner)
        self.assertIn("varios dispositivos", report.errors[0])

    def test_diagnose_fastboot_getvar_all(self) -> None:
        mapping = self._props()
        mapping[("fastboot", "devices")] = result("ZY22ABC123\tfastboot\n")
        mapping[("fastboot", "-s", "ZY22ABC123", "getvar", "all")] = result(
            stderr=FASTBOOT_UNLOCKED
        )
        fake = FakeExecute(mapping)
        runner = diag.CommandRunner(
            adb_path="adb", fastboot_path="fastboot", execute=fake
        )
        report = diag.diagnose(runner)
        self.assertTrue(report.fastboot_connected)
        self.assertEqual(report.fastboot_vars["unlocked"], "yes")
        self.assertEqual(report.bootloader_state, "DESBLOQUEADO")
        text = diag.format_report(report)
        self.assertIn("DESBLOQUEADO", text)

    def test_main_adb_missing_exit_code(self) -> None:
        runner = diag.CommandRunner(adb_path="")
        report = diag.diagnose(runner)
        formatted = diag.format_report(report)
        self.assertIn("PATH", formatted)
        self.assertIn("ERROR", formatted)


if __name__ == "__main__":
    unittest.main()
