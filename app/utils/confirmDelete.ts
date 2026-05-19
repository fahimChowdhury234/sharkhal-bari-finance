import { useConfirmDialog } from '~/composables/useConfirmDialog'

export function confirmDelete(message: string) {
  const { confirm } = useConfirmDialog()

  return confirm({
    title: 'Are you sure?',
    message,
    confirmLabel: 'Delete',
    cancelLabel: 'Cancel',
    tone: 'danger'
  })
}
