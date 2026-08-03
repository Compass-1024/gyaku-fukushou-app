const DEFAULT_MESSAGE = '回答中のセットが破棄されます。よろしいですか？'

export function confirmExit(
  hasProgress: boolean,
  onExit: () => void,
  message: string = DEFAULT_MESSAGE,
): void {
  if (hasProgress && !window.confirm(message)) {
    return
  }
  onExit()
}
