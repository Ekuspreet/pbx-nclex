import { brand } from './navigation.js'
import { business } from '../business.js'

export const footer = {
  brand,
  groups: [
    {
      title: 'Policies',
      links: [
        { label: 'Terms & Conditions', href: '/terms-and-conditions' },
        { label: 'Privacy Policy', href: '/privacy-policy' },
        { label: 'Return & Refund Policy', href: '/return-refund-policy' },
        { label: 'Cancellation Policy', href: '/cancellation-policy' },
        { label: 'Disclaimer', href: '/disclaimer' },
      ],
    },
    { title: 'Company', links: [{ label: 'About Us', href: '/about-us' }] },
  ],
  legalName: business.legalName,
  registeredAddress: business.registeredAddress,
  copyright: 'Copyright 2026 PBX Nursing. All rights reserved.',
}
