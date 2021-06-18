type LineNumberReturnObject = RegExpExecArray & {
  line: string
  number: number
  match: RegExpExecArray
}
declare module "line-number" {
  function ln(str: string, re: RegExp): LineNumberReturnObject[]
}
