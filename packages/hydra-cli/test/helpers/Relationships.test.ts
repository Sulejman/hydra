import { expect } from 'chai'
import * as fs from 'fs-extra'
import { EnumContextProvider } from '../../src/generate/EnumContextProvider'
import { ModelRenderer } from '../../src/generate/ModelRenderer'
import { RelationshipGenerator } from '../../src/generate/RelationshipGenerator'
import { WarthogModel } from '../../src/model'
import { fromStringSchema } from './model'

describe('ReletionshipGenerator', () => {
  let model: WarthogModel
  let generator: ModelRenderer
  let modelTemplate: string
  let enumCtxProvider: EnumContextProvider
  let resolverTemplate: string

  before(() => {
    modelTemplate = fs.readFileSync(
      './src/templates/entities/model.ts.mst',
      'utf-8'
    )

    resolverTemplate = fs.readFileSync(
      './src/templates/entities/resolver.ts.mst',
      'utf-8'
    )
  })

  it('should not create import statement for self referenced entities', () => {
    model = fromStringSchema(`
    type Member @entity {
      invitor: Member
      invitees: [Member!] @derivedFrom(field: "invitor")
    }`)
    generator = new ModelRenderer(
      model,
      model.lookupEntity('Member'),
      enumCtxProvider
    )
    const rendered = generator.render(modelTemplate)
    expect(rendered).to.not.include(
      `import { Member } from '../member/member.model.ts'`
    )
  })

  it('should include only one relationship', () => {
    model = fromStringSchema(`
    type Channel @entity {
      id: ID!
      category: ChannelCategory
    }

    type ChannelCategory @entity {
      id: ID!
      channels: [Channel!] @derivedFrom(field: "category")
    }
    `)

    const relGenerator = new RelationshipGenerator(model)
    relGenerator.generate()
    expect(relGenerator.relationships.length).to.be.equal(1)
  })

  it('should add a new field to other entity for onetomany', () => {
    model = fromStringSchema(`
    type Extrinsic @entity {
      id: ID!
      hash: String!
    }
    type Event @entity {
      id: ID!
      inExtrinsic: Extrinsic!
    }`)

    generator = new ModelRenderer(
      model,
      model.lookupEntity('Extrinsic'),
      enumCtxProvider
    )
    const rendered = generator.render(modelTemplate)

    expect(rendered).to.include(
      `@OneToMany(() => Event, (param: Event) => param.inExtrinsic`
    )
    expect(rendered).to.include(`eventinExtrinsic?: Event[]`)

    // Resolver return type should be ok as well
    const resolver = generator.render(resolverTemplate)
    expect(resolver).to.include(
      `async eventinExtrinsic(@Root() r: Extrinsic): Promise<Event[] | null> {`
    )
  })
})
