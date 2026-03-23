import React from 'react'
import { content } from '../data/content'
import TechBadge from '../components/TechBadge'
import './Stack.css'

export default function Stack() {
  const { stack } = content

  return (
    <section id="stack" className="stack reveal">
      <div className="container">
        <h2 className="section-title">{stack.title}</h2>

        <div className="stack-groups">
          {stack.groups.map((group, index) => (
            <div key={index} className="stack-group reveal-child">
              <h3 className="stack-group-title">{group.name}</h3>
              <div className="stack-items">
                {group.items.map((item) => (
                  <TechBadge key={item} text={item} variant="secondary" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
