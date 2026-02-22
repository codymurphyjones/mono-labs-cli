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
          style={{
            ...style,
            padding: '12px',
            borderRadius: '6px',
            fontSize: '13px',
            overflow: 'auto',
            margin: 0,
          }}
        >
          {tokens.map((line, i) => (
            <div key={i} {...getLineProps({ line })}>
              {showLineNumbers && (
                <span
                  style={{
                    display: 'inline-block',
                    width: '3em',
                    textAlign: 'right',
                    marginRight: '1em',
                    color: '#6b7280',
                    userSelect: 'none',
                  }}
                >
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
