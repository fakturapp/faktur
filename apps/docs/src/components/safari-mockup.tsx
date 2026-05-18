import type { SVGProps } from 'react'

export interface SafariProps extends SVGProps<SVGSVGElement> {
  url?: string
  src?: string
  width?: number
  height?: number
}

/**
 * Safari (macOS) browser window mockup. Use as a frame around screenshots.
 * Source: shadcn/ui mockup library. adapted for the docs theme.
 */
export function Safari({
  src,
  url,
  width = 1203,
  height = 753,
  ...props
}: SafariProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <g clipPath="url(#safari-clip-path0)">
        <path
          d="M0 52H1202V741C1202 747.627 1196.63 753 1190 753H12C5.37258 753 0 747.627 0 741V52Z"
          className="fill-[#E5E5E5] dark:fill-[#404040]"
        />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M0 12C0 5.37258 5.37258 0 12 0H1190C1196.63 0 1202 5.37258 1202 12V52H0L0 12Z"
          className="fill-[#E5E5E5] dark:fill-[#404040]"
        />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M1.06738 12C1.06738 5.92487 5.99225 1 12.0674 1H1189.93C1196.01 1 1200.93 5.92487 1200.93 12V51H1.06738V12Z"
          className="fill-white dark:fill-[#262626]"
        />
        <circle cx="27" cy="25" r="6" fill="#FF5F57" />
        <circle cx="47" cy="25" r="6" fill="#FEBC2E" />
        <circle cx="67" cy="25" r="6" fill="#28C840" />
        <path
          d="M286 17C286 13.6863 288.686 11 292 11H946C949.314 11 952 13.6863 952 17V35C952 38.3137 949.314 41 946 41H292C288.686 41 286 38.3137 286 35V17Z"
          className="fill-[#F5F5F5] dark:fill-[#404040]"
        />
        <g className="mix-blend-luminosity">
          <text
            x="619"
            y="30"
            textAnchor="middle"
            fill="#737373"
            fontSize="12"
            fontFamily="ui-sans-serif, system-ui, -apple-system, sans-serif"
          >
            {url}
          </text>
        </g>
        {src && (
          <image
            href={src}
            width="1200"
            height="700"
            x="1"
            y="52"
            preserveAspectRatio="xMidYMid slice"
            clipPath="url(#safari-rounded-bottom)"
          />
        )}
      </g>
      <defs>
        <clipPath id="safari-clip-path0">
          <rect width={width} height={height} fill="white" />
        </clipPath>
        <clipPath id="safari-rounded-bottom">
          <path
            d="M1 52H1201V741C1201 747.075 1196.08 752 1190 752H12C5.92486 752 1 747.075 1 741V52Z"
            fill="white"
          />
        </clipPath>
      </defs>
    </svg>
  )
}
