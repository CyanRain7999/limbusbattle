const paths:Record<string,string>={
  sword:'<path d="m5 19 5-5M4 15l5 5M10 14 20 4l-5 1-8 10M13 11l2 2"/>',
  people:'<path d="M9 13a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM2 21v-2a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v2M17 5a4 4 0 0 1 0 8m2 2a5 5 0 0 1 3 5v1"/>',
  target:'<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M12 1v4m0 14v4M1 12h4m14 0h4"/>',
  settings:'<path d="m9 3-1 3-3 1-2 3 2 2v3l2 2 3-1 2 2 3-1 1-3 3-1 1-3-2-2V6l-3-2-3 1Z"/><circle cx="11" cy="11" r="3"/>',
  volume:'<path d="M4 9h4l5-4v14l-5-4H4Zm12-2a7 7 0 0 1 0 10m3-13a11 11 0 0 1 0 16"/>',
  mute:'<path d="M4 9h4l5-4v14l-5-4H4Zm13 0 5 6m0-6-5 6"/>',
  full:'<path d="M4 9V4h5m6 0h5v5M4 15v5h5m6 0h5v-5"/>',
  arrow:'<path d="M4 12h16m-6-6 6 6-6 6"/>',
  pause:'<path d="M8 5v14M16 5v14"/>',
  close:'<path d="m5 5 14 14M19 5 5 19"/>',
  key:'<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M5 9h2m3 0h2m3 0h2M5 12h2m3 0h2m3 0h4M7 16h10"/>',
  bolt:'<path d="m13 2-8 12h6l-1 8 9-13h-7Z"/>',
  diamond:'<path d="m12 2 10 10-10 10L2 12Z"/><path d="m8 12 4-4 4 4-4 4Z"/>',
  refresh:'<path d="M20 8a8 8 0 1 0 0 9M20 3v6h-6"/>',
  bus:'<path d="M5 18V6c0-4 14-4 14 0v12ZM5 10h14M8 4v6m8-6v6M5 15h3m8 0h3M7 18v3m10-3v3"/>'
};
export const icon=(name:string)=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="square" stroke-linejoin="miter" aria-hidden="true">${paths[name]??paths.diamond}</svg>`;
