export const helpState: {
   open: boolean;
   topic: string;
   anchor: string | undefined;
} = $state({
   open: false,
   topic: 'getting-started',
   anchor: undefined,
});

export function openHelp(topic: string, anchor?: string): void {
   helpState.open = true;
   helpState.topic = topic;
   helpState.anchor = anchor;
}

export function closeHelp(): void {
   helpState.open = false;
   helpState.anchor = undefined;
}
