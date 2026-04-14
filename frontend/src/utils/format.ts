/**
 * 格式化 ETH 价格，统一显示为最多 4 位小数（自动去除尾部 0）
 */
export function formatPrice(value: string | number | undefined | null, decimals = 2): string {
  if (value === undefined || value === null || value === '') return '0'
  const num = parseFloat(value.toString())
  if (isNaN(num)) return '0'
  // 保持至少 decimals 位小数（通常为 2），匹配 MetaMask 的一般显示风格
  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })
}
