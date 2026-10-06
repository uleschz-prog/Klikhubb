// SPDX-License-Identifier: MIT
pragma solidity ^0.8.34;

/// @notice Interfaz mínima del router que llama LyraAgent.
/// @dev Hoy la implementa MockSwapRouter. Más adelante se sustituye por el router
///      real de Uniswap (`swapExactTokensForTokens`).
interface IProfitSwapRouter {
    function swapUSDCForProfit(uint256 amountIn) external returns (uint256 amountOut);
}
