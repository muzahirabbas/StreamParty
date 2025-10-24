import React from 'react';

export default function OrientationIcon({ className = "w-6 h-6" }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2.086h-5v-.582M4 4l1.72 1.72m12.56 12.56L17 17M4 4L17 17m3-5v.582h-5M20 20v-5h-.582M20 20l-1.72-1.72M7 4.086l-1.72 1.72" />
    </svg>
  );
}