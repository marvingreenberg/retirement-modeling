import { processConditionalSections, renderMarkdown } from './helpMarkdown';

const mdModules = import.meta.glob('./help/en/*.md', {
	query: '?raw',
	import: 'default',
	eager: true,
}) as Record<string, string>;

function loadRawMd(topicId: string): string {
	const key = `./help/en/${topicId}.md`;
	return (mdModules[key] as string) ?? '';
}

export function getTopicHtml(
	topicId: string,
	conditions?: Record<string, boolean>,
): string {
	let md = loadRawMd(topicId);
	if (!md) return '<p>No content available for this topic.</p>';
	if (conditions) md = processConditionalSections(md, conditions);
	return renderMarkdown(md);
}
