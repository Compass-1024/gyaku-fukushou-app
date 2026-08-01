export function confirmExit(hasProgress: boolean, onExit: () => void): void {
  if (
    hasProgress &&
    !window.confirm('回答中のセットが破棄されます。よろしいですか？')
  ) {
    return
  }
  onExit()
}
