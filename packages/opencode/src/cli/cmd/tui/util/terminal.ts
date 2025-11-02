export namespace Terminal {
  export async function colors() {
    return new Promise<string[]>((resolve) => {
      if (!process.stdin.isTTY) {
        resolve([])
        return
      }

      const colors: string[] = Array(16).fill("")
      let buffer = ""
      const TMUX = !!process.env.TMUX
      const received = new Set<number>()

      const cleanup = () => {
        process.stdin.setRawMode(false)
        process.stdin.pause()
        process.stdin.removeListener("data", handler)
      }

      const parseRgbToHex = (colorStr: string): string => {
        if (colorStr.startsWith("rgb:")) {
          const parts = colorStr.substring(4).split("/")
          const r = (parseInt(parts[0], 16) >> 8).toString(16).padStart(2, "0")
          const g = (parseInt(parts[1], 16) >> 8).toString(16).padStart(2, "0")
          const b = (parseInt(parts[2], 16) >> 8).toString(16).padStart(2, "0")
          return `#${r}${g}${b}`
        }
        return colorStr
      }

      const handler = (data: Buffer) => {
        buffer += data.toString()

        // Match OSC 11 (background color) - store at index 0
        const bgMatch = buffer.match(/\x1b\]11;([^\x07\x1b]+)/)
        if (bgMatch && !received.has(0)) {
          colors[0] = parseRgbToHex(bgMatch[1])
          received.add(0)
        }

        // Match OSC 4 (palette colors 0-15) - store at indices 0-15
        const paletteRegex = /\x1b\]4;(\d+);([^\x07\x1b]+)/g
        let match
        while ((match = paletteRegex.exec(buffer)) !== null) {
          const index = parseInt(match[1])
          if (index < 16 && !received.has(index)) {
            colors[index] = parseRgbToHex(match[2])
            received.add(index)
          }
        }

        if (received.size === 16) {
          cleanup()
          resolve(colors)
        }
      }

      process.stdin.setRawMode(true)
      process.stdin.resume()
      process.stdin.on("data", handler)

      const wrap = (query: string) => (TMUX ? `\x1bPtmux;\x1b${query}\x1b\\` : query)

      process.stdout.write(wrap("\x1b]11;?\x07"))

      for (let i = 0; i < 16; i++) {
        process.stdout.write(wrap(`\x1b]4;${i};?\x07`))
      }

      setTimeout(() => {
        cleanup()
        resolve(colors)
      }, 500)
    })
  }
}
