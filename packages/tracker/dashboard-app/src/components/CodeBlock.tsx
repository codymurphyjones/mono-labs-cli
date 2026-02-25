import { Highlight, themes } from 'prism-react-renderer'

interface CodeBlockProps {
  code: string
  language?: string
  showLineNumbers?: boolean
  startLine?: number
}

export function CodeBlock({ code, language = 'typescript', showLineNumbers, startLine = 1 }: CodeBlockProps) {
  return (
    <Highlight theme={themes.nightOwl} code={code} language={language}>
      {({ style, tokens, getLineProps, getTokenProps }) => (
        <pre
          className="p-3 rounded-md text-[13px] overflow-auto m-0"
          style={style}
        >
          {tokens.map((line, i) => (
            <div key={i} {...getLineProps({ line })}>
              {showLineNumbers && (
                <span className="inline-block w-[3em] text-right mr-4 text-gray-500 select-none">
                  {startLine + i}
                </span>
              )}
              {line.map((token, key) => (
                <span key={key} {...getTokenProps({ token })} />
              ))}
            </div>
          ))}
        </pre>
      )}
    </Highlight>
  )
}
