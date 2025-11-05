"use client";
import React from "react";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  MotionValue,
} from "motion/react";
import Image from "next/image";
import Link from "next/link";



export const HeroParallax = ({
  products,
}: {
  products: {
    title: string;
    link: string;
    thumbnail: string;
    book_id?: string;
    uniqueKey?: string;
  }[];
}) => {
  // Dividir los productos en filas, pero solo usar las filas necesarias
  // Si hay menos de 15 productos, distribuir de manera inteligente
  const firstRow = products.slice(0, Math.min(5, products.length));
  const secondRow = products.length > 5 ? products.slice(5, Math.min(10, products.length)) : [];
  const thirdRow = products.length > 10 ? products.slice(10, Math.min(15, products.length)) : [];
  const ref = React.useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const springConfig = { stiffness: 300, damping: 30, bounce: 100 };

  const translateX = useSpring(
    useTransform(scrollYProgress, [0, 1], [0, 1000]),
    springConfig
  );
  const translateXReverse = useSpring(
    useTransform(scrollYProgress, [0, 1], [0, -1000]),
    springConfig
  );
  const rotateX = useSpring(
    useTransform(scrollYProgress, [0, 0.2], [15, 0]),
    springConfig
  );
  const opacity = useSpring(
    useTransform(scrollYProgress, [0, 0.2], [0.2, 1]),
    springConfig
  );
  const rotateZ = useSpring(
    useTransform(scrollYProgress, [0, 0.2], [20, 0]),
    springConfig
  );
  const translateY = useSpring(
    useTransform(scrollYProgress, [0, 0.2], [-700, 500]),
    springConfig
  );
  return (
    <div
      ref={ref}
      className="h-[220vh] py-0 overflow-hidden  antialiased relative flex flex-col self-auto [perspective:1000px] [transform-style:preserve-3d]"
    >
      <Header />
      <motion.div
        style={{
          rotateX,
          rotateZ,
          translateY,
          opacity,
        }}
        className="flex flex-col items-center justify-center"
      >
        <motion.div className="flex flex-row-reverse space-x-reverse space-x-4 md:space-x-20 mb-10 md:mb-20 justify-center">
          {firstRow.map((product, index) => (
            <ProductCard
              product={product}
              translate={translateX}
              key={product.uniqueKey || product.book_id || `${product.title}-${index}`}
            />
          ))}
        </motion.div>
        <motion.div className="flex flex-row mb-10 md:mb-20 space-x-4 md:space-x-20 justify-center">
          {secondRow.map((product, index) => (
            <ProductCard
              product={product}
              translate={translateXReverse}
              key={product.uniqueKey || product.book_id || `${product.title}-${index}`}
            />
          ))}
        </motion.div>
        <motion.div className="flex flex-row-reverse space-x-reverse space-x-20 justify-center">
          {thirdRow.map((product, index) => (
            <ProductCard
              product={product}
              translate={translateX}
              key={product.uniqueKey || product.book_id || `${product.title}-${index}`}
            />
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
};

export const Header = () => {
  return (
    <div className="max-w-7xl relative mx-auto py-2 md:py-4 px-4 w-full left-0 top-0">
      <div className="mt-8 md:mt-12 flex justify-center">
        <Image alt="logo" src={'/logo2.svg'} width={350} height={450}/>
      </div>
      {/* <h1 className="text-2xl md:text-7xl font-bold dark:text-white">
        Click & Read
     
      <h1 className="text-3x1 md:text-5xl font-italic text-gray-800 dark:text-white"> Aeterna Libri</h1>*/}
      <p className="max-w-2xl text-base md:text-xl mt-6 dark:text-neutral-200 text-justify mx-auto">
      Miles de historias te esperan entre nuestros estantes virtuales. Sumérgete en un universo literario donde donde solo un click te separa de una puerta a un mundo nuevo. Ya sea que busques reencontrarte con ese sentimiento de no poder soltar un libro, descubrir una joya oculta de un autor emergente o aventurarte en un género que nunca antes habías explorado, este es tu punto de partida.
      </p> 
    </div>
  );
};

export const ProductCard = ({
  product,
  translate,
}: {
  product: {
    title: string;
    link: string;
    thumbnail: string;
    book_id?: string;
    uniqueKey?: string;
  };
  translate: MotionValue<number>;
}) => {
  return (
    <motion.div
      style={{
        x: translate,
      }}
      whileHover={{
        y: -10,
      }}
      className="group/product h-[16rem] w-[10rem] md:h-[28rem] md:w-[18rem] relative shrink-0"
    >
      <Link
        href={product.link}
        className="block group-hover/product:shadow-2xl relative w-full h-full"
      >
        {product.thumbnail ? (
          <div className="relative w-full h-full overflow-hidden">
            <Image
              key={product.uniqueKey || product.book_id || product.title}
              src={product.thumbnail}
              fill
              className="object-cover object-left-top"
              alt={product.title}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              priority={false}
              unoptimized={false}
              onError={() => {
                // Log error si la imagen no carga
                console.error('Error loading image:', product.thumbnail, 'for book:', product.title);
              }}
            />
          </div>
        ) : (
          <div className="absolute h-full w-full inset-0 bg-gray-200 flex items-center justify-center">
            <span className="text-gray-400">Sin imagen</span>
          </div>
        )}
      </Link>
      <div className="absolute inset-0 h-full w-full opacity-0 group-hover/product:opacity-80 bg-black pointer-events-none"></div>
      <h2 className="absolute bottom-2 md:bottom-4 left-2 md:left-4 opacity-0 group-hover/product:opacity-100 text-white z-10 text-xs md:text-base">
        {product.title}
      </h2>
    </motion.div>
  );
};
