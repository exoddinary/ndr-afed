"use client"

import { Card } from "@/components/ui/card"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { useRouter } from "next/navigation"

type DashCard = {
  key: "map" | "catalog" | "upload" | "geb" | "analytics"
  title: string
  description: string
  bg: string
  icon: React.ReactNode
  cta: string
  href: string
}

// Inline SVG for Catalog card with animatable ellipse layers
function CatalogBackgroundAnimated() {
  return (
    <svg
      className="w-full h-full"
      viewBox="0 0 457 457"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      focusable="false"
      preserveAspectRatio="xMidYMid slice"
    >
      <g clipPath="url(#clip0_29_202)">
        <rect width="456.406" height="456.406" fill="url(#paint0_linear_29_202)" />
        {/* ellipse 1 */}
        <g style={{ mixBlendMode: 'overlay' as any }} opacity="0.1" filter="url(#filter0_d_29_202)" id="Ellipse1"
           className="transition-transform duration-500 ease-out origin-center group-hover:scale-[1.4] transform-gpu">
          <circle cx="535.179" cy="408.273" r="312.968" fill="white" />
        </g>
        {/* ellipse 2 */}
        <g style={{ mixBlendMode: 'overlay' as any }} opacity="0.1" filter="url(#filter1_d_29_202)" id="Ellipse2"
           className="transition-transform duration-500 ease-out origin-center group-hover:scale-[1.4] transform-gpu">
          <circle cx="373.354" cy="541.171" r="312.968" fill="white" />
        </g>
      </g>
      <defs>
        <filter id="filter0_d_29_202" x="201.511" y="71.6054" width="667.336" height="667.336" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
          <feMorphology radius="7" operator="dilate" in="SourceAlpha" result="effect1_dropShadow_29_202" />
          <feOffset dy="-3" />
          <feGaussianBlur stdDeviation="6.85" />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0" />
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_29_202" />
          <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_29_202" result="shape" />
        </filter>
        <filter id="filter1_d_29_202" x="39.6862" y="204.503" width="667.336" height="667.336" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
          <feMorphology radius="7" operator="dilate" in="SourceAlpha" result="effect1_dropShadow_29_202" />
          <feOffset dy="-3" />
          <feGaussianBlur stdDeviation="6.85" />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0" />
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_29_202" />
          <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_29_202" result="shape" />
        </filter>
        <linearGradient id="paint0_linear_29_202" x1="23.6246" y1="-1.90901e-06" x2="430.102" y2="456.406" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6D23A0" />
          <stop offset="1" stopColor="#1E5E6C" />
        </linearGradient>
        <clipPath id="clip0_29_202">
          <rect width="456.406" height="456.406" fill="white" />
        </clipPath>
      </defs>
    </svg>
  )
}

// Inline SVG for GEB card with animatable hexagon layers
function GEBBackgroundAnimated() {
  return (
    <svg
      className="w-full h-full"
      viewBox="0 0 457 457"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      focusable="false"
      preserveAspectRatio="xMidYMid slice"
    >
      <g clipPath="url(#clip0_geb)">
        <rect width="456.406" height="456.406" fill="url(#paint0_linear_geb)" />
        {/* hexagon 1 */}
        <g style={{ mixBlendMode: 'overlay' as any }} opacity="0.1" filter="url(#filter0_d_geb)" id="Hexagon1"
           className="transition-transform duration-500 ease-out origin-center group-hover:scale-[1.4] transform-gpu">
          <path d="M228.203 50L378.406 140.102V320.305L228.203 410.406L78 320.305V140.102L228.203 50Z" fill="white" />
        </g>
        {/* hexagon 2 */}
        <g style={{ mixBlendMode: 'overlay' as any }} opacity="0.1" filter="url(#filter1_d_geb)" id="Hexagon2"
           className="transition-transform duration-500 ease-out origin-center group-hover:scale-[1.4] transform-gpu">
          <path d="M328.203 100L428.406 165.102V295.305L328.203 360.406L228 295.305V165.102L328.203 100Z" fill="white" />
        </g>
      </g>
      <defs>
        <filter id="filter0_d_geb" x="57.3" y="26.3" width="341.806" height="407.806" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
          <feMorphology radius="7" operator="dilate" in="SourceAlpha" result="effect1_dropShadow_geb" />
          <feOffset dy="-3" />
          <feGaussianBlur stdDeviation="6.85" />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0" />
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_geb" />
          <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_geb" result="shape" />
        </filter>
        <filter id="filter1_d_geb" x="207.3" y="76.3" width="241.806" height="307.806" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
          <feMorphology radius="7" operator="dilate" in="SourceAlpha" result="effect1_dropShadow_geb" />
          <feOffset dy="-3" />
          <feGaussianBlur stdDeviation="6.85" />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0" />
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_geb" />
          <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_geb" result="shape" />
        </filter>
        <linearGradient id="paint0_linear_geb" x1="228.203" y1="0" x2="228.203" y2="456.406" gradientUnits="userSpaceOnUse">
          <stop stopColor="#A855F7" />
          <stop offset="1" stopColor="#6366F1" />
        </linearGradient>
        <clipPath id="clip0_geb">
          <rect width="456.406" height="456.406" fill="white" />
        </clipPath>
      </defs>
    </svg>
  )
}

// Inline SVG for Analytics card with animatable bar chart layers
function AnalyticsBackgroundAnimated() {
  return (
    <svg
      className="w-full h-full"
      viewBox="0 0 457 457"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      focusable="false"
      preserveAspectRatio="xMidYMid slice"
    >
      <g clipPath="url(#clip0_analytics)">
        <rect width="456.406" height="456.406" fill="url(#paint0_linear_analytics)" />
        {/* bar 1 */}
        <g style={{ mixBlendMode: 'overlay' as any }} opacity="0.1" filter="url(#filter0_d_analytics)" id="Bar1"
           className="transition-transform duration-500 ease-out origin-bottom group-hover:scale-y-[1.3] transform-gpu">
          <rect x="50" y="200" width="100" height="250" fill="white" />
        </g>
        {/* bar 2 */}
        <g style={{ mixBlendMode: 'overlay' as any }} opacity="0.1" filter="url(#filter1_d_analytics)" id="Bar2"
           className="transition-transform duration-500 ease-out origin-bottom group-hover:scale-y-[1.3] transform-gpu">
          <rect x="180" y="120" width="100" height="330" fill="white" />
        </g>
        {/* bar 3 */}
        <g style={{ mixBlendMode: 'overlay' as any }} opacity="0.1" filter="url(#filter2_d_analytics)" id="Bar3"
           className="transition-transform duration-500 ease-out origin-bottom group-hover:scale-y-[1.3] transform-gpu">
          <rect x="310" y="160" width="100" height="290" fill="white" />
        </g>
      </g>
      <defs>
        <filter id="filter0_d_analytics" x="29.3" y="176.3" width="141.4" height="291.4" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
          <feMorphology radius="7" operator="dilate" in="SourceAlpha" result="effect1_dropShadow_analytics" />
          <feOffset dy="-3" />
          <feGaussianBlur stdDeviation="6.85" />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0" />
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_analytics" />
          <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_analytics" result="shape" />
        </filter>
        <filter id="filter1_d_analytics" x="159.3" y="96.3" width="141.4" height="371.4" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
          <feMorphology radius="7" operator="dilate" in="SourceAlpha" result="effect1_dropShadow_analytics" />
          <feOffset dy="-3" />
          <feGaussianBlur stdDeviation="6.85" />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0" />
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_analytics" />
          <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_analytics" result="shape" />
        </filter>
        <filter id="filter2_d_analytics" x="289.3" y="136.3" width="141.4" height="331.4" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
          <feMorphology radius="7" operator="dilate" in="SourceAlpha" result="effect1_dropShadow_analytics" />
          <feOffset dy="-3" />
          <feGaussianBlur stdDeviation="6.85" />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0" />
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_analytics" />
          <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_analytics" result="shape" />
        </filter>
        <linearGradient id="paint0_linear_analytics" x1="228.203" y1="0" x2="228.203" y2="456.406" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F59E0B" />
          <stop offset="1" stopColor="#EF4444" />
        </linearGradient>
        <clipPath id="clip0_analytics">
          <rect width="456.406" height="456.406" fill="white" />
        </clipPath>
      </defs>
    </svg>
  )
}

// Inline SVG for Upload card with animatable rectangle layers
function UploadBackgroundAnimated() {
  return (
    <svg
      className="w-full h-full"
      viewBox="0 0 457 457"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      focusable="false"
      preserveAspectRatio="xMidYMid slice"
    >
      <g clipPath="url(#clip0_29_208)">
        <rect width="456.406" height="456.406" fill="url(#paint0_linear_29_208)" />
        {/* rectangle 1 */}
        <g style={{ mixBlendMode: 'overlay' as any }} opacity="0.1" filter="url(#filter0_d_29_208)" id="Rectangle1"
           className="transition-transform duration-500 ease-out origin-center group-hover:scale-[1.4] transform-gpu">
          <rect x="-258.468" y="239.209" width="408.123" height="408.123" transform="rotate(-10.533 -258.468 239.209)" fill="white" />
        </g>
        {/* rectangle 2 */}
        <g style={{ mixBlendMode: 'overlay' as any }} opacity="0.1" filter="url(#filter1_d_29_208)" id="Rectangle2"
           className="transition-transform duration-500 ease-out origin-center group-hover:scale-[1.4] transform-gpu">
          <rect x="-87.1536" y="346.961" width="408.123" height="408.123" transform="rotate(-10.533 -87.1536 346.961)" fill="white" />
        </g>
      </g>
      <defs>
        <filter id="filter0_d_29_208" x="-279.168" y="140.904" width="517.252" height="517.252" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
          <feMorphology radius="7" operator="dilate" in="SourceAlpha" result="effect1_dropShadow_29_208" />
          <feOffset dy="-3" />
          <feGaussianBlur stdDeviation="6.85" />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0" />
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_29_208" />
          <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_29_208" result="shape" />
        </filter>
        <filter id="filter1_d_29_208" x="-107.854" y="248.656" width="517.252" height="517.252" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
          <feMorphology radius="7" operator="dilate" in="SourceAlpha" result="effect1_dropShadow_29_208" />
          <feOffset dy="-3" />
          <feGaussianBlur stdDeviation="6.85" />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0" />
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_29_208" />
          <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_29_208" result="shape" />
        </filter>
        <linearGradient id="paint0_linear_29_208" x1="228.203" y1="0" x2="429.667" y2="524.304" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0E36A1" />
          <stop offset="1" stopColor="#3C9088" />
        </linearGradient>
        <clipPath id="clip0_29_208">
          <rect width="456.406" height="456.406" fill="white" />
        </clipPath>
      </defs>
    </svg>
  )
}

const MapIcon = () => (
  <svg width="24" height="24" viewBox="0 0 40 40" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <g clipPath="url(#clip0_12326_10781)">
      <path d="M35.4568 4.17053C35.1202 3.96261 34.7 3.94359 34.3459 4.12024L25.6855 8.45158L15.8925 4.09848C15.8765 4.09165 15.8582 4.09044 15.841 4.08361C15.797 4.06714 15.7519 4.05341 15.7062 4.0425C15.6607 4.03024 15.6145 4.02067 15.5679 4.0139C15.4751 4.00627 15.3818 4.00627 15.289 4.0139C15.2424 4.02067 15.1962 4.03024 15.1508 4.0425C15.105 4.05341 15.06 4.06714 15.0159 4.08361C14.9988 4.09044 14.9805 4.09158 14.9645 4.09848L4.67881 8.66988C4.26598 8.85329 3.99993 9.2627 4 9.71444V34.857C3.99993 35.4882 4.51153 36 5.14273 36C5.30264 36 5.46074 35.9666 5.60686 35.9016L15.4285 31.5359L25.2501 35.9016C25.2672 35.9084 25.2855 35.9016 25.3026 35.9119C25.5793 36.0357 25.8969 36.0286 26.1677 35.8925C26.186 35.8845 26.2066 35.8925 26.2249 35.8799L35.3676 31.3085C35.755 31.1149 35.9998 30.7188 35.9996 30.2856V5.14304C35.9996 4.74668 35.7942 4.37859 35.4568 4.17053Z" />
    </g>
  </svg>
)

const CatalogIcon = () => (
  <svg width="24" height="24" viewBox="0 0 40 40" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 4H7C5.3457 4 4 5.3457 4 7V16C4 17.6543 5.3457 19 7 19H16C17.6543 19 19 17.6543 19 16V7C19 5.3457 17.6543 4 16 4Z" />
    <path d="M33 4H24C22.3457 4 21 5.3457 21 7V16C21 17.6543 22.3457 19 24 19H33C34.6543 19 36 17.6543 36 16V7C36 5.3457 34.6543 4 33 4Z" />
    <path d="M33 21H24C22.3457 21 21 22.3457 21 24V33C21 34.6543 22.3457 36 24 36H33C34.6543 36 36 34.6543 36 33V24C36 22.3457 34.6543 21 33 21Z" />
    <path d="M16 21H7C5.3457 21 4 22.3457 4 24V33C4 34.6543 5.3457 36 7 36H16C17.6543 36 19 34.6543 19 33V24C19 22.3457 17.6543 21 16 21Z" />
  </svg>
)

const UploadIcon = () => (
  <svg width="24" height="24" viewBox="0 0 38 38" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M32.5128 5.48476C30.1942 3.16602 26.4621 3.16602 18.9982 3.16602C11.5343 3.16602 7.80238 3.16602 5.48366 5.48476C4.2843 6.6841 3.7053 8.26156 3.42578 10.538C4.26601 9.60277 5.27559 8.82371 6.40926 8.24608C7.6466 7.61561 8.97153 7.35995 10.4385 7.24009C11.8558 7.1243 13.5997 7.12432 15.7321 7.12435H22.2643C24.3968 7.12432 26.1407 7.1243 27.5579 7.24009C29.025 7.35995 30.35 7.61561 31.5872 8.24608C32.7208 8.82371 33.7305 9.60277 34.5706 10.538C34.2912 8.26156 33.7122 6.6841 32.5128 5.48476Z" />
    <path fillRule="evenodd" clipRule="evenodd" d="M3.16797 22.1667C3.16797 17.7329 3.16797 15.516 4.03084 13.8226C4.78982 12.333 6.00093 11.1219 7.49055 10.3629C9.18402 9.5 11.4009 9.5 15.8346 9.5H22.168C26.6018 9.5 28.8186 9.5 30.5121 10.3629C32.0017 11.1219 33.2128 12.333 33.9717 13.8226C34.8346 15.516 34.8346 17.7329 34.8346 22.1667C34.8346 26.6005 34.8346 28.8173 33.9717 30.5108C33.2128 32.0004 32.0017 33.2115 30.5121 33.9704C28.8186 34.8333 26.6018 34.8333 22.168 34.8333H15.8346C11.4009 34.8333 9.18402 34.8333 7.49055 33.9704C6.00093 33.2115 4.78982 32.0004 4.03084 30.5108C3.16797 28.8173 3.16797 26.6005 3.16797 22.1667ZM19.8409 16.577C19.6183 16.3542 19.3162 16.2292 19.0013 16.2292C18.6864 16.2292 18.3843 16.3542 18.1617 16.577L14.2033 20.5354C13.7395 20.9991 13.7395 21.7509 14.2033 22.2146C14.667 22.6784 15.4189 22.6784 15.8826 22.2146L17.8138 20.2836V26.9167C17.8138 27.5725 18.3455 28.1042 19.0013 28.1042C19.6571 28.1042 20.1888 27.5725 20.1888 26.9167V20.2836L22.12 22.2146C22.5838 22.6784 23.3355 22.6784 23.7993 22.2146C24.263 21.7509 24.263 20.9991 23.7993 20.5354L19.8409 16.577Z" />
  </svg>
)

const GEBIcon = () => (
  <svg width="24" height="24" viewBox="0 0 40 40" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 4C11.1634 4 4 11.1634 4 20C4 28.8366 11.1634 36 20 36C28.8366 36 36 28.8366 36 20C36 11.1634 28.8366 4 20 4ZM20 8C26.6274 8 32 13.3726 32 20C32 26.6274 26.6274 32 20 32C13.3726 32 8 26.6274 8 20C8 13.3726 13.3726 8 20 8ZM20 12C15.5817 12 12 15.5817 12 20C12 24.4183 15.5817 28 20 28C24.4183 28 28 24.4183 28 20C28 15.5817 24.4183 12 20 12ZM20 16C22.2091 16 24 17.7909 24 20C24 22.2091 22.2091 24 20 24C17.7909 24 16 22.2091 16 20C16 17.7909 17.7909 16 20 16Z" />
  </svg>
)

const AnalyticsIcon = () => (
  <svg width="24" height="24" viewBox="0 0 40 40" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M6 32C6 33.1046 6.89543 34 8 34H32C33.1046 34 34 33.1046 34 32V8C34 6.89543 33.1046 6 32 6H8C6.89543 6 6 6.89543 6 8V32Z" />
    <path d="M12 26C11.4477 26 11 26.4477 11 27C11 27.5523 11.4477 28 12 28H16C16.5523 28 17 27.5523 17 27V19C17 18.4477 16.5523 18 16 18H12C11.4477 18 11 18.4477 11 19V26Z" fill="white" />
    <path d="M20 26C19.4477 26 19 26.4477 19 27C19 27.5523 19.4477 28 20 28H24C24.5523 28 25 27.5523 25 27V13C25 12.4477 24.5523 12 24 12H20C19.4477 12 19 12.4477 19 13V26Z" fill="white" />
    <path d="M28 26C27.4477 26 27 26.4477 27 27C27 27.5523 27.4477 28 28 28H32C32.5523 28 33 27.5523 33 27V21C33 20.4477 32.5523 20 32 20H28C27.4477 20 27 20.4477 27 21V26Z" fill="white" />
  </svg>
)

const cards: DashCard[] = [
  {
    key: "map",
    title: "Map",
    description: "Gain access to a unified view of well and map data.",
    bg: "/icons/Map.svg",
    icon: <MapIcon />,
    cta: "View Map",
    href: "/ai-geospatial",
  },
  {
    key: "catalog",
    title: "Catalog",
    description: "Explore all map metadata and make edits as needed.",
    bg: "/icons/Catalogs.svg",
    icon: <CatalogIcon />,
    cta: "Browse Catalog",
    href: "/catalog",
  },
  {
    key: "upload",
    title: "Upload",
    description: "Upload map and well data in acceptable formats.",
    bg: "/icons/Upload.svg",
    icon: <UploadIcon />,
    cta: "Upload Files",
    href: "/upload",
  },
  {
    key: "analytics",
    title: "Analytics",
    description: "Analyze data trends and generate comprehensive reports.",
    bg: "/icons/Analytics.svg",
    icon: <AnalyticsIcon />,
    cta: "View Analytics",
    href: "/analytics",
  },
  {
    key: "geb",
    title: "GEB",
    description: "Access Global Exploration Basin data and insights.",
    bg: "/icons/GEB.svg",
    icon: <GEBIcon />,
    cta: "View GEB",
    href: "/geb",
  },
]

export function ActionCards() {
  const router = useRouter()

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
      {cards.map((c) => {
        const wrapperClasses = c.key === 'geb'
          ? 'block md:col-span-2 h-[220px] md:h-[240px]'
          : 'block h-[220px] md:h-[240px]'

        const cardInner = (
          <Card
            className={
              'group h-full relative overflow-hidden rounded-xl border border-border bg-card/60 backdrop-blur-sm shadow-sm p-6 flex flex-col cursor-pointer transform-gpu will-change-transform'
            }
          >
            {c.key === 'map' && (
              <div className="absolute inset-0 -z-10 pointer-events-none">
                <MapBackgroundAnimated />
              </div>
            )}
            {c.key === 'catalog' && (
              <div className="absolute inset-0 -z-10 pointer-events-none">
                <CatalogBackgroundAnimated />
              </div>
            )}
            {c.key === 'upload' && (
              <div className="absolute inset-0 -z-10 pointer-events-none">
                <UploadBackgroundAnimated />
              </div>
            )}
            {c.key === 'geb' && (
              <div className="absolute inset-0 -z-10 pointer-events-none">
                <GEBBackgroundAnimated />
              </div>
            )}
            {c.key === 'analytics' && (
              <div className="absolute inset-0 -z-10 pointer-events-none">
                <AnalyticsBackgroundAnimated />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-br from-black/10 via-transparent to-black/10 pointer-events-none z-10" />
            <div className="relative z-20 flex flex-col h-full" style={{ color: '#ffffff' }}>
              <div className="flex items-center gap-2 mb-3">
                {c.icon}
                <h3 className="text-xl font-semibold" style={{ color: '#ffffff' }}>{c.title}</h3>
              </div>
              <p className="text-sm pr-6" style={{ color: '#ffffff', opacity: 0.9 }}>
                {c.description}
              </p>
              <div className="mt-auto pt-4">
                {c.key !== 'catalog' ? (
                  <span className="inline-flex items-center gap-2 hover:underline" style={{ color: '#ffffff' }}>
                    {c.cta}
                    <ArrowRight className="h-4 w-4" style={{ color: '#ffffff' }} />
                  </span>
                ) : (
                  <div className="flex flex-col gap-2">
                    <Link
                      href="/catalog"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-2 hover:underline"
                      style={{ color: '#ffffff' }}
                    >
                      Browse Well Data
                      <ArrowRight className="h-4 w-4" style={{ color: '#ffffff' }} />
                    </Link>
                    <Link
                      href="/catalog?tab=map"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-2 hover:underline"
                      style={{ color: '#ffffff' }}
                    >
                      Browse Map Data
                      <ArrowRight className="h-4 w-4" style={{ color: '#ffffff' }} />
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </Card>
        )

        if (c.key === 'catalog') {
          return (
            <div
              key={c.key}
              onClick={() => router.push('/catalog')}
              className={wrapperClasses}
              role="button"
              aria-label="Open Well Data Catalog"
            >
              {cardInner}
            </div>
          )
        }

        if (c.key === 'analytics') {
          return (
            <div
              key={c.key}
              onClick={() => window.alert('SEEK Analytics will be linked later')}
              className={wrapperClasses}
              role="button"
              aria-label="Analytics coming soon"
            >
              {cardInner}
            </div>
          )
        }

        return (
          <Link key={c.key} href={c.href} className={wrapperClasses}>
            {cardInner}
          </Link>
        )
      })}
    </div>
  )
}

// Inline SVG for Map card with animatable layers
function MapBackgroundAnimated() {
  return (
    <svg
      className="w-full h-full"
      viewBox="0 0 457 457"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      focusable="false"
      preserveAspectRatio="xMidYMid slice"
    >
      <g clipPath="url(#clip0_29_195)">
        <rect width="456.406" height="456.406" fill="url(#paint0_linear_29_195)" />
        {/* Polygon 1 */}
        <g style={{ mixBlendMode: 'overlay' as any }} opacity="0.1" filter="url(#filter0_d_29_195)" id="Polygon1"
           className="transition-transform duration-500 ease-out origin-center group-hover:scale-[1.4] transform-gpu">
          <path d="M341.391 100.412L622.408 587.147H60.3749L341.391 100.412Z" fill="white" />
        </g>
        {/* Polygon 2 */}
        <g style={{ mixBlendMode: 'overlay' as any }} opacity="0.1" filter="url(#filter1_d_29_195)" id="Polygon2"
           className="transition-transform duration-500 ease-out origin-center group-hover:scale-[1.4] transform-gpu">
          <path d="M125.959 262.992L406.976 749.727H-155.057L125.959 262.992Z" fill="white" />
        </g>
      </g>
      <defs>
        <filter id="filter0_d_29_195" x="39.6749" y="76.7124" width="603.433" height="528.135" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
          <feMorphology radius="7" operator="dilate" in="SourceAlpha" result="effect1_dropShadow_29_195" />
          <feOffset dy="-3" />
          <feGaussianBlur stdDeviation="6.85" />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0" />
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_29_195" />
          <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_29_195" result="shape" />
        </filter>
        <filter id="filter1_d_29_195" x="-175.757" y="239.292" width="603.433" height="528.135" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
          <feMorphology radius="7" operator="dilate" in="SourceAlpha" result="effect1_dropShadow_29_195" />
          <feOffset dy="-3" />
          <feGaussianBlur stdDeviation="6.85" />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0" />
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_29_195" />
          <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_29_195" result="shape" />
        </filter>
        <linearGradient id="paint0_linear_29_195" x1="228.203" y1="0" x2="228.203" y2="456.406" gradientUnits="userSpaceOnUse">
          <stop stopColor="#07ABAF" />
          <stop offset="1" stopColor="#0D779D" />
        </linearGradient>
        <clipPath id="clip0_29_195">
          <rect width="456.406" height="456.406" fill="white" />
        </clipPath>
      </defs>
    </svg>
  )
}
