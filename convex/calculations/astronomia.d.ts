// Type declarations for astronomia library

declare module 'astronomia/julian' {
  export class Calendar {
    constructor(year?: number | Date, month?: number, day?: number)
    year: number
    month: number
    day: number
    toJD(): number
    fromJD(jd: number): this
  }

  export class CalendarGregorian extends Calendar {
    toJD(): number
    fromJD(jd: number): this
  }

  export function CalendarGregorianToJD(year: number, month: number, day: number): number
  export function JDToCalendarGregorian(jd: number): { year: number; month: number; day: number }
}

declare module 'astronomia/base' {
  export const J2000: number
  export const JulianYear: number
  export const JulianCentury: number
  export function JulianYearToJDE(jy: number): number
  export function JDEToJulianYear(jde: number): number
  export function sincos(angle: number): [number, number]
  export function modf(x: number): [number, number]
}

declare module 'astronomia/planetposition' {
  export class Planet {
    constructor(data: unknown)
    position(jd: number): { lon: number; lat: number; range: number }
  }
}

declare module 'astronomia/solar' {
  export function apparentEquatorial(jd: number): { ra: number; dec: number }
  export function apparentLongitude(T: number): number
  export function meanAnomaly(jd: number): number
}

declare module 'astronomia/moonposition' {
  export function position(jd: number): { lon: number; lat: number; range: number }
}

declare module 'astronomia/nutation' {
  export function nutation(jd: number): [number, number]
  export function meanObliquity(jd: number): number
  export function trueObliquity(jd: number): number
}

declare module 'astronomia/coord' {
  export class Ecliptic {
    lon: number
    lat: number
    constructor(lon?: number, lat?: number)
    toEquatorial(obliquity: number): Equatorial
  }

  export class Equatorial {
    ra: number
    dec: number
    constructor(ra?: number, dec?: number)
    toEcliptic(obliquity: number): Ecliptic
  }
}

declare module 'astronomia/data/vsop87Bearth' {
  const data: unknown
  export default data
}

declare module 'astronomia/data/vsop87Bmercury' {
  const data: unknown
  export default data
}

declare module 'astronomia/data/vsop87Bvenus' {
  const data: unknown
  export default data
}

declare module 'astronomia/data/vsop87Bmars' {
  const data: unknown
  export default data
}

declare module 'astronomia/data/vsop87Bjupiter' {
  const data: unknown
  export default data
}

declare module 'astronomia/data/vsop87Bsaturn' {
  const data: unknown
  export default data
}

declare module 'astronomia/data/vsop87Buranus' {
  const data: unknown
  export default data
}

declare module 'astronomia/data/vsop87Bneptune' {
  const data: unknown
  export default data
}
