import { brand } from './navigation.js'

export const footer = {
  brand,
  groups: [
    {
      title: 'Page',
      links: [
        { label: 'Home', href: '/' },
        { label: 'Features', href: '/#features' },
        { label: 'Access', href: '/#access' },
        { label: 'Join', href: '/#join' },
      ],
    },
    {
      title: 'Access',
      links: [
        { label: 'Sign up', href: '/signup' },
        { label: 'Log in', href: '/login' },
      ],
    },
  ],
  copyright: 'Copyright 2026 PBX - NCLEX. All rights reserved.',
}
