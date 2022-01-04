export function csv(headers, rows) {
  let csv = headers.map(key => `"${key}"`).join(",")

  for (let row of rows) {
    csv = `${csv}\n${headers
      .map(header => {
        let val = row[header]
        val = typeof val === "object" ? JSON.stringify(val) : val
        return `"${val}"`.trim()
      })
      .join(",")}`
  }
  return csv
}

export function json(headers, rows) {
  return JSON.stringify(rows, undefined, 2)
}

export const ExportFormats = {
  CSV: "csv",
  JSON: "json",
}
