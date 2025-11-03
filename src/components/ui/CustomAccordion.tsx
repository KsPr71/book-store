
import React from "react";
import {
  Accordion,
  AccordionHeader,
  AccordionBody,
} from "@material-tailwind/react";
import ExpandableCardDemo from "@/components/expandable-card-demo-standard";
export function DefaultAccordion() {
  const [open, setOpen] = React.useState(0);
 
  const handleOpen = (value: number) => setOpen(open === value ? 0 : value);
 
  return (
    <div className="bg-gray-50 py-8">
      <div className="px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 w-full flex justify-center">
        {/* @ts-expect-error - Material Tailwind Accordion types are incomplete */}
        <Accordion 
            open={open === 1} 
            className={`text-center transition-all duration-500 ease-in-out ${
              open === 1 
                ? 'w-full' 
                : 'w-full max-w-md'
            } bg-blue-400 hover:bg-blue-500 rounded-lg overflow-hidden shadow-none hover:shadow-xl hover:shadow-gray-500/50 transition-all duration-300`}
            >
          {/* @ts-expect-error - Material Tailwind AccordionHeader types are incomplete */}
          <AccordionHeader 
            onClick={() => handleOpen(1)}
            className="text-center justify-center flex items-center gap-3 w-full text-white hover:text-blue-100 py-4 px-6"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              className="w-5 h-5"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            Autores en el Catalogo
          </AccordionHeader>
          <AccordionBody className="text-center w-full bg-white">
            <div className="flex justify-center">
              <div className="w-full">
                <ExpandableCardDemo />
              </div>
            </div>
          </AccordionBody>
        </Accordion>
      </div>
    </div>
)
}