
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
    <div className="bg-gray-50">
      <div className="px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 w-full">
        {/* @ts-expect-error - Material Tailwind Accordion types are incomplete */}
        <Accordion 
            open={open === 1} 
            className="text-center w-full"
            >
          {/* @ts-expect-error - Material Tailwind AccordionHeader types are incomplete */}
          <AccordionHeader 
            onClick={() => handleOpen(1)}
            className="text-center justify-center flex items-center w-full hover:text-blue-500"
          >
            Autores en el Catalogo
          </AccordionHeader>
          <AccordionBody className="text-center w-full bg-gray-25">
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