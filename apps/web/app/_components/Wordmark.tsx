type WordmarkProps = {
  text: string;
  monogramText?: string;
};

export function Wordmark({ text, monogramText }: WordmarkProps) {
  return (
    <span className="wordmark">
      {monogramText ? <span className="wordmark-monogram">{monogramText}</span> : null}
      <span>{text}</span>
    </span>
  );
}
