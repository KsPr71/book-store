import React from 'react'

interface DeviderProps {
  title: string;
}

export const Devider = ({ title }: DeviderProps) => {
  return (
    <div className="flex items-center my-8">
      <span className="h-px flex-1 bg-gray-300 dark:bg-gray-600"></span>
      <span className="shrink-0 px-4 text-gray-900 dark:text-white font-large">{title}</span>
      <span className="h-px flex-1 bg-gray-300 dark:bg-gray-600"></span>
    </div>
  )
}