export function getButtonClass(variant = 'primary') {
  const variants = {
    primary: 'btn btn-primary',
    secondary: 'btn btn-outline btn-secondary',
    ghost: 'btn btn-ghost',
  }

  return variants[variant] ?? variants.primary
}
