'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from "framer-motion"
import { Heart } from "lucide-react"

interface ToggleItem {
  name: string;
  subtypes?: string[];
}

interface ToggleListProps {
  items: ToggleItem[];
  value: Record<string, { mainSelected: number; subtypes: Record<string, number> }>;
  onChange: (value: Record<string, { mainSelected: number; subtypes: Record<string, number> }>) => void;
}

export function ToggleList({ items, value, onChange }: ToggleListProps) {
  const [openPopup, setOpenPopup] = useState<string | null>(null)

  const toggleMainItem = (name: string) => {
    const newValue = value[name]?.mainSelected === 1 ? 0 : 1;
    const newPreferences = {
      ...value,
      [name]: {
        mainSelected: newValue,
        subtypes: value[name]?.subtypes || {}
      }
    };
    onChange(newPreferences);
  }

  const toggleSubItem = (name: string, subtype: string) => {
    const newValue = (value[name]?.subtypes?.[subtype] || 0) === 1 ? 0 : 1;
    const currentSubtypes = {
      ...value[name]?.subtypes,
      [subtype]: newValue
    };

    const hasCheckedSubtypes = Object.values(currentSubtypes).some(v => v === 1);
    const newPreferences = {
      ...value,
      [name]: {
        mainSelected: hasCheckedSubtypes ? 1 : 0,
        subtypes: currentSubtypes
      }
    };
    onChange(newPreferences);
  }

  return (
    <div className="flex flex-wrap gap-4">
      {items.map((item) => (
        <div key={item.name} className="relative">
          <button
            type="button"
            onClick={() => {
              if (item.subtypes?.length) {
                setOpenPopup(openPopup === item.name ? null : item.name)
              } else {
                toggleMainItem(item.name)
              }
            }}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border-2 
              ${value[item.name]?.mainSelected === 1 || 
                Object.values(value[item.name]?.subtypes || {}).some(v => v === 1)
                  ? "border-pink-500"
                  : "border-gray-600 hover:border-gray-400"
              } transition-colors cursor-pointer`}
          >
            <span>{item.name}</span>
            <Heart
              className={`w-4 h-4 transition-all ${
                value[item.name]?.mainSelected === 1 || 
                Object.values(value[item.name]?.subtypes || {}).some(v => v === 1)
                  ? "fill-pink-500 text-pink-500"
                  : "text-gray-400"
              }`}
            />
          </button>
        </div>
      ))}
      
      <AnimatePresence>
        {openPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setOpenPopup(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-800 rounded-lg p-6 w-full max-w-sm max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">{openPopup}の種類</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {items
                  .find((a) => a.name === openPopup)
                  ?.subtypes?.map((subtype) => (
                    <button
                      type="button"
                      key={subtype}
                      onClick={() => toggleSubItem(openPopup, subtype)}
                      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border-2 
                        ${value[openPopup]?.subtypes?.[subtype] === 1
                          ? "border-pink-500"
                          : "border-gray-600 hover:border-gray-400"
                        } transition-colors`}
                    >
                      {subtype}
                      <Heart
                        className={`w-4 h-4 transition-all ${
                          value[openPopup]?.subtypes?.[subtype] === 1
                            ? "fill-pink-500 text-pink-500"
                            : "text-gray-400"
                        }`}
                      />
                    </button>
                  ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
} 