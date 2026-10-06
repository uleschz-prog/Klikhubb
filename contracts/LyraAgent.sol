// SPDX-License-Identifier: MIT
pragma solidity ^0.8.34;

import {IERC20} from "./interfaces/IERC20.sol";
import {IProfitSwapRouter} from "./interfaces/IProfitSwapRouter.sol";

/// @title LyraAgent
/// @notice Deposita USDC y deja que un keeper (Gelato o Chainlink) ejecute un swap.
/// @dev El router es un mock. La llamada de keeper no tiene onlyOwner.
contract LyraAgent {
    uint256 public constant COOLDOWN = 1 hours;

    address public owner;
    uint256 public lastExecutionTime;
    IERC20 public immutable usdc;
    IProfitSwapRouter public immutable router;

    event Deposit(address indexed from, uint256 amount);
    event Withdraw(address indexed to, uint256 amount);
    event Swap(uint256 amountIn, uint256 amountOut);
    event TradeExecuted(
        string action,
        string asset,
        uint256 timestamp,
        uint256 amountIn,
        uint256 amountOut
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "LyraAgent: not owner");
        _;
    }

    constructor(address usdc_, address router_) {
        require(usdc_ != address(0), "LyraAgent: zero usdc");
        require(router_ != address(0), "LyraAgent: zero router");
        owner = msg.sender;
        usdc = IERC20(usdc_);
        router = IProfitSwapRouter(router_);
        // El cooldown empieza al desplegar: la primera ejecución espera 1 hora.
        lastExecutionTime = block.timestamp;
    }

    /// @notice El owner deposita USDC. Hace falta allowance previa.
    function depositUSDC(uint256 amount) external onlyOwner {
        require(amount > 0, "LyraAgent: zero amount");
        require(usdc.transferFrom(msg.sender, address(this), amount), "LyraAgent: transfer failed");
        emit Deposit(msg.sender, amount);
    }

    /// @notice Keeper: si pasó el cooldown y hay USDC, cambia todo el saldo en el router.
    function checkAndExecute() external {
        require(block.timestamp > lastExecutionTime + COOLDOWN, "LyraAgent: cooldown");

        uint256 amountIn = usdc.balanceOf(address(this));
        require(amountIn > 0, "LyraAgent: no balance");

        require(usdc.approve(address(router), amountIn), "LyraAgent: approve failed");
        uint256 amountOut = router.swapUSDCForProfit(amountIn);

        lastExecutionTime = block.timestamp;

        emit Swap(amountIn, amountOut);
        emit TradeExecuted("BUY", "ETH", block.timestamp, amountIn, amountOut);
    }

    /// @notice El owner retira USDC (saldo o ganancia) hacia sí mismo.
    function withdrawProfits(uint256 amount) external onlyOwner {
        require(amount > 0, "LyraAgent: zero amount");
        uint256 balance = usdc.balanceOf(address(this));
        require(amount <= balance, "LyraAgent: insufficient balance");
        require(usdc.transfer(owner, amount), "LyraAgent: transfer failed");
        emit Withdraw(owner, amount);
    }

    /// @notice Vista para keepers: cooldown cumplido y saldo USDC mayor que cero.
    function canExecute() public view returns (bool) {
        if (block.timestamp <= lastExecutionTime + COOLDOWN) {
            return false;
        }
        return usdc.balanceOf(address(this)) > 0;
    }

    /// @notice Vista estilo Gelato: si puede ejecutarse y el calldata de `checkAndExecute`.
    function checker() external view returns (bool canExec, bytes memory execPayload) {
        canExec = canExecute();
        execPayload = abi.encodeCall(this.checkAndExecute, ());
    }
}
