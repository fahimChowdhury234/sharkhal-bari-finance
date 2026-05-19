type ConfirmTone = 'danger' | 'warning' | 'neutral'

export interface ConfirmDialogOptions {
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  tone?: ConfirmTone
}

interface ConfirmDialogState extends Required<Omit<ConfirmDialogOptions, 'title' | 'message'>> {
  open: boolean
  title: string
  message: string
}

const defaultState: ConfirmDialogState = {
  open: false,
  title: 'Confirm action',
  message: '',
  confirmLabel: 'Confirm',
  cancelLabel: 'Cancel',
  tone: 'danger'
}

let pendingResolver: ((value: boolean) => void) | null = null

export function useConfirmDialog() {
  const confirmState = useState<ConfirmDialogState>('confirm-dialog-state', () => ({ ...defaultState }))

  function close(value: boolean) {
    confirmState.value = { ...defaultState }

    if (pendingResolver) {
      pendingResolver(value)
      pendingResolver = null
    }
  }

  function confirm(options: ConfirmDialogOptions) {
    if (process.server) {
      return Promise.resolve(true)
    }

    if (pendingResolver) {
      pendingResolver(false)
      pendingResolver = null
    }

    confirmState.value = {
      ...defaultState,
      ...options,
      open: true
    }

    return new Promise<boolean>((resolve) => {
      pendingResolver = resolve
    })
  }

  return {
    confirmState,
    confirm,
    accept: () => close(true),
    decline: () => close(false)
  }
}
