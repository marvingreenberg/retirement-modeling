import { portfolio, profile, numSimulations } from '$lib/stores';

let autoSave = $state(false);

export function isAutoSave(): boolean {
   return autoSave;
}

export function initAutoSave() {
   autoSave = localStorage.getItem('retirement-sim-autosave') === 'true';
}

export function toggleAutoSave() {
   autoSave = !autoSave;
   localStorage.setItem('retirement-sim-autosave', String(autoSave));
   if (autoSave) saveToLocalStorage();
}

export function saveToLocalStorage() {
   const data = {
      portfolio: portfolio.value,
      profile: profile.value,
      numSimulations: numSimulations.value,
   };
   localStorage.setItem('retirement-sim-state', JSON.stringify(data));
}
