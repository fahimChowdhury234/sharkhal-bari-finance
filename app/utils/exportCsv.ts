type CsvValue = string | number | boolean | null | undefined

function escapeCsvValue(value: CsvValue) {
  const text = value == null ? '' : String(value)
  if (/[,"\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`
  }
  return text
}

export function buildCsv(headers: string[], rows: CsvValue[][]) {
  const lines = [
    headers.map(escapeCsvValue).join(','),
    ...rows.map((row) => row.map(escapeCsvValue).join(','))
  ]

  return lines.join('\n')
}

export function downloadCsv(filename: string, headers: string[], rows: CsvValue[][]) {
  const csv = buildCsv(headers, rows)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = filename
  link.style.display = 'none'

  document.body.appendChild(link)
  link.click()
  link.remove()

  URL.revokeObjectURL(url)
}
