// All interface artwork is selected from Kareem's supplied SVG.rar archive.
export default function PlatformIcon({ name, size = '1em', width = size, height = size, color = 'currentColor', className = '', style = {}, ...props }) {
  const labelled = props['aria-label'] || props['aria-labelledby'];
  return <svg {...props} className={`ui-icon ${className}`.trim()} width={width} height={height} viewBox="0 0 24 24" fill="currentColor" aria-hidden={labelled ? undefined : 'true'} style={{ display: 'inline-block', verticalAlign: '-0.12em', color, ...style }}><use href={`/icons/ui.svg#${name}`} /></svg>;
}
