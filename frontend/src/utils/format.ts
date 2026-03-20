/**
 * 格式化 ETH 价格，统一显示为最多 4 位小数（自动去除尾部 0）
 */
export function formatPrice(value: string | number | undefined | null, decimals = 4): string {
  if (value === undefined || value === null || value === '') return '0'
  const num = parseFloat(value.toString())
  if (isNaN(num)) return '0'
  // toFixed 最多 4 位，再去除尾部多余的 0
  return parseFloat(num.toFixed(decimals)).toString()
}
