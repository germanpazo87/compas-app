import React from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css'; 

interface Props {
  content: string;
}

export const StatementRenderer: React.FC<Props> = ({ content }) => {
  
  // 🛡️ SEGURETAT: Si el contingut és undefined, null o buit, no renderitzis el parser.
  // Això evita l'error "Cannot read properties of undefined (reading 'split')"
  if (!content) {
    return (
      <div className="text-gray-400 italic p-6 bg-white rounded-lg border border-dashed border-gray-200">
        Carregant l'enunciat de l'exercici...
      </div>
    );
  }

  // Funció per renderitzar una expressió LaTeX de forma segura
  const renderMath = (formula: string, isBlock: boolean = false) => {
    try {
      const html = katex.renderToString(formula, {
        throwOnError: false,
        displayMode: isBlock
      });
      return <span dangerouslySetInnerHTML={{ __html: html }} />;
    } catch (error) {
      console.error("KaTeX error:", error);
      return <span>{formula}</span>;
    }
  };

  // Parser: Divideix el text per "$" per trobar fórmules inline
  const parts = content.split(/\$(.*?)\$/g);

  return (
    <div className="text-lg leading-relaxed text-gray-800 bg-white p-6 rounded-lg shadow-sm border border-gray-100">
      {parts.map((part, index) => {
        // Índex parell: Text normal
        if (index % 2 === 0) {
          return <span key={index}>{part}</span>;
        } else {
          // Índex senar: Fórmula LaTeX
          return (
            <span key={index} className="mx-1 inline-block">
              {renderMath(part)}
            </span>
          );
        }
      })}
    </div>
  );
};