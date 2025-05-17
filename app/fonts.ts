import localFont from 'next/font/local'

export const calSans = localFont({
  src: '/fonts/CalSans-SemiBold.woff2',
  weight: '600',
  style: 'normal',
  display: 'swap',
  variable: '--font-cal',
})
