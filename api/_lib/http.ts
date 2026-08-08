import type { IncomingMessage, ServerResponse } from 'node:http'

// Vercel Node Functionsは(req, res)のNode.js標準API形式でハンドラを呼び出す
// （Web標準のRequest/Responseではない）ため、JSON送受信のための薄いヘルパーを用意する

export async function readJsonBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = []
  for await (const chunk of req) {
    chunks.push(chunk as Buffer)
  }
  const raw = Buffer.concat(chunks).toString('utf8')
  return raw.length > 0 ? JSON.parse(raw) : null
}

export function getHeader(req: IncomingMessage, name: string): string | undefined {
  const value = req.headers[name.toLowerCase()]
  return Array.isArray(value) ? value[0] : value
}

// Vercelはクライアントの実IPを x-forwarded-for の先頭要素として渡す
export function getClientIp(req: IncomingMessage): string {
  const forwarded = getHeader(req, 'x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return req.socket.remoteAddress ?? 'unknown'
}

export function sendEmpty(res: ServerResponse, status: number): void {
  res.statusCode = status
  res.end()
}

export function sendJson(res: ServerResponse, status: number, body: unknown): void {
  res.statusCode = status
  res.setHeader('content-type', 'application/json')
  res.end(JSON.stringify(body))
}
