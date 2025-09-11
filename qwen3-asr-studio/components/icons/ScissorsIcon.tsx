import React from 'react';

export const ScissorsIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 7.5c0 .828-.328 1.5-.999 1.5S5.501 8.328 5.501 7.5s.328-1.5 1-1.5s1 .672 1 1.5Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 7.5c0 .828-.328 1.5-1 1.5s-1-.672-1-1.5.328-1.5 1-1.5 1 .672 1 1.5Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 12L6.5 6.5m0 11L12 12m6-5.5L12 12m5.5 5.5L12 12" />
  </svg>
);