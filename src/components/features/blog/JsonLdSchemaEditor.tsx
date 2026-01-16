'use client'

import React, { useState } from 'react'
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { AdditionalSchema, SchemaType } from '@/types/blog'

interface Props {
  schemas: AdditionalSchema[]
  onChange: (schemas: AdditionalSchema[]) => void
}

const SCHEMA_TEMPLATES: Record<string, Record<string, unknown>> = {
  FAQPage: {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Question 1?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Answer to question 1',
        },
      },
    ],
  },
  HowTo: {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: 'How to do something',
    description: 'Step-by-step guide',
    step: [
      {
        '@type': 'HowToStep',
        name: 'Step 1',
        text: 'Description of step 1',
      },
    ],
  },
  Recipe: {
    '@context': 'https://schema.org',
    '@type': 'Recipe',
    name: 'Recipe Name',
    author: {
      '@type': 'Person',
      name: 'Author Name',
    },
    datePublished: new Date().toISOString().split('T')[0],
    description: 'Recipe description',
    recipeIngredient: ['Ingredient 1', 'Ingredient 2'],
    recipeInstructions: [
      {
        '@type': 'HowToStep',
        text: 'Step 1',
      },
    ],
  },
  Product: {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: 'Product Name',
    description: 'Product description',
    offers: {
      '@type': 'Offer',
      price: '0.00',
      priceCurrency: 'USD',
    },
  },
  Review: {
    '@context': 'https://schema.org',
    '@type': 'Review',
    itemReviewed: {
      '@type': 'Thing',
      name: 'Item Name',
    },
    author: {
      '@type': 'Person',
      name: 'Reviewer Name',
    },
    reviewRating: {
      '@type': 'Rating',
      ratingValue: '5',
      bestRating: '5',
    },
    reviewBody: 'Review text here',
  },
  Event: {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: 'Event Name',
    startDate: new Date().toISOString(),
    location: {
      '@type': 'Place',
      name: 'Location Name',
      address: 'Address',
    },
  },
  Custom: {
    '@context': 'https://schema.org',
    '@type': 'Thing',
  },
}

const SCHEMA_BUTTON_STYLES: Record<string, string> = {
  FAQPage: 'bg-blue-600 hover:bg-blue-700',
  HowTo: 'bg-green-600 hover:bg-green-700',
  Recipe: 'bg-orange-600 hover:bg-orange-700',
  Product: 'bg-purple-600 hover:bg-purple-700',
  Review: 'bg-pink-600 hover:bg-pink-700',
  Event: 'bg-teal-600 hover:bg-teal-700',
  Custom: 'bg-gray-600 hover:bg-gray-700',
}

export default function JsonLdSchemaEditor({ schemas, onChange }: Props) {
  const [expandedSchemas, setExpandedSchemas] = useState<Set<string>>(new Set())
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  const addSchema = (type: SchemaType) => {
    const newSchema: AdditionalSchema = {
      id: `schema-${Date.now()}`,
      type,
      data: SCHEMA_TEMPLATES[type] ? { ...SCHEMA_TEMPLATES[type] } : { ...SCHEMA_TEMPLATES.Custom },
    }
    onChange([...schemas, newSchema])
    setExpandedSchemas(new Set([...expandedSchemas, newSchema.id]))
  }

  const removeSchema = (id: string) => {
    onChange(schemas.filter((s) => s.id !== id))
    const newExpanded = new Set(expandedSchemas)
    newExpanded.delete(id)
    setExpandedSchemas(newExpanded)
    const newErrors = { ...validationErrors }
    delete newErrors[id]
    setValidationErrors(newErrors)
  }

  const updateSchema = (id: string, jsonString: string) => {
    try {
      const parsed = JSON.parse(jsonString)
      onChange(schemas.map((s) => (s.id === id ? { ...s, data: parsed } : s)))
      setValidationErrors({ ...validationErrors, [id]: '' })
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : 'Invalid JSON'
      setValidationErrors({ ...validationErrors, [id]: errorMsg })
    }
  }

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedSchemas)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedSchemas(newExpanded)
  }

  return (
    <div className="space-y-4">
      {/* Add Schema Buttons */}
      <div className="flex flex-wrap gap-2">
        {(
          ['FAQPage', 'HowTo', 'Recipe', 'Product', 'Review', 'Event', 'Custom'] as SchemaType[]
        ).map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => addSchema(type)}
            className={`flex items-center gap-1 rounded px-3 py-1.5 text-sm text-white ${SCHEMA_BUTTON_STYLES[type]}`}
          >
            <Plus size={16} /> {type === 'FAQPage' ? 'FAQ' : type}
          </button>
        ))}
      </div>

      {/* Schema List */}
      {schemas.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-300 py-8 text-center">
          <p className="text-gray-500">No additional schemas added</p>
          <p className="mt-1 text-sm text-gray-400">Click buttons above to add structured data</p>
        </div>
      ) : (
        <div className="space-y-3">
          {schemas.map((schema, index) => (
            <div key={schema.id} className="overflow-hidden rounded-lg border border-gray-200">
              {/* Header */}
              <div className="flex items-center justify-between bg-gray-50 px-4 py-3">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => toggleExpand(schema.id)}
                    className="text-gray-600 hover:text-gray-900"
                  >
                    {expandedSchemas.has(schema.id) ? (
                      <ChevronUp size={20} />
                    ) : (
                      <ChevronDown size={20} />
                    )}
                  </button>
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {schema.type === 'FAQPage' ? 'FAQ' : schema.type} Schema #{index + 1}
                    </h4>
                    <p className="text-xs text-gray-500">
                      Type: {(schema.data['@type'] as string) || 'Unknown'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeSchema(schema.id)}
                  className="rounded p-1 text-red-600 hover:bg-red-50 hover:text-red-800"
                  title="Remove schema"
                >
                  <Trash2 size={18} />
                </button>
              </div>

              {/* Editor (Collapsible) */}
              {expandedSchemas.has(schema.id) && (
                <div className="space-y-2 p-4">
                  <textarea
                    value={JSON.stringify(schema.data, null, 2)}
                    onChange={(e) => updateSchema(schema.id, e.target.value)}
                    className={`min-h-[250px] w-full rounded border p-3 font-mono text-sm focus:outline-none focus:ring-2 ${
                      validationErrors[schema.id]
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-blue-500'
                    }`}
                  />
                  {validationErrors[schema.id] && (
                    <p className="text-sm text-red-600">❌ {validationErrors[schema.id]}</p>
                  )}
                  <div className="text-xs text-gray-500">
                    💡 Tip: Validate with{' '}
                    <a
                      href="https://validator.schema.org/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline hover:text-blue-800"
                    >
                      Schema.org Validator
                    </a>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Example Schemas */}
      <details className="rounded border border-gray-200 bg-gray-50 p-3">
        <summary className="cursor-pointer text-sm font-medium text-gray-700">
          📖 View Example Schemas
        </summary>
        <div className="mt-3 space-y-4 text-xs">
          <div>
            <p className="font-medium text-gray-900">FAQ Schema Example:</p>
            <pre className="mt-1 overflow-x-auto rounded bg-white p-2 text-gray-700">
              {`{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [{
    "@type": "Question",
    "name": "What is MyVirtualMate?",
    "acceptedAnswer": {
      "@type": "Answer",
      "text": "MyVirtualMate is a virtual assistant platform..."
    }
  }]
}`}
            </pre>
          </div>

          <div>
            <p className="font-medium text-gray-900">HowTo Schema Example:</p>
            <pre className="mt-1 overflow-x-auto rounded bg-white p-2 text-gray-700">
              {`{
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "How to Set Up Virtual Assistant",
  "step": [{
    "@type": "HowToStep",
    "name": "Step 1: Sign Up",
    "text": "Visit our website and create an account"
  }]
}`}
            </pre>
          </div>
        </div>
      </details>
    </div>
  )
}
