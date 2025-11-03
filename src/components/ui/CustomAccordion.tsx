
import React from "react";
import {
  Accordion,
  AccordionHeader,
  AccordionBody,
} from "@material-tailwind/react";
import ExpandableCardDemo from "@/components/expandable-card-demo-standard";
export function DefaultAccordion() {
  const [open, setOpen] = React.useState(1);
 
  const handleOpen = (value: number) => setOpen(open === value ? 0 : value);
 
  return (
    <div className="bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <Accordion 
            open={open === 1} 
            className="text-center w-full"
            placeholder={undefined}
            onResize={undefined}
            onResizeCapture={undefined}
            onPointerEnterCapture={undefined}
            onPointerLeaveCapture={undefined}           
            >
          <AccordionHeader 
            onClick={() => handleOpen(1)}
            className="text-center justify-center flex items-center w-full hover:text-blue-500"
   
          >
            Autores en el Catalogo
          </AccordionHeader>
          <AccordionBody className="text-center w-full bg-gray-25">
            <div className="flex justify-center">
              <div className="w-full max-w-4xl">
                <ExpandableCardDemo />
              </div>
            </div>
          </AccordionBody>
        </Accordion>
      </div>
    </div>
)
}