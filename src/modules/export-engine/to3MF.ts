import JSZip from 'jszip'
import * as THREE from 'three'

export async function export3MF(
  geometry: THREE.BufferGeometry,
  _filename: string
): Promise<Blob> {
  const positions = geometry.getAttribute('position')
  const indices = geometry.getIndex()

  if (!positions) {
    throw new Error('Geometry tiene no vertices')
  }

  const posArray = positions.array as Float32Array
  const indArray = indices ? (indices.array as Uint32Array | Uint16Array) : null

  let verticesXml = ''
  for (let i = 0; i < posArray.length; i += 3) {
    const x = (posArray[i] * 10).toFixed(4)
    const y = (posArray[i + 1] * 10).toFixed(4)
    const z = (posArray[i + 2] * 10).toFixed(4)
    verticesXml += `<vertex x="${x}" y="${y}" z="${z}" />\n`
  }

  let trianglesXml = ''
  if (indArray) {
    for (let i = 0; i < indArray.length; i += 3) {
      const v1 = indArray[i]
      const v2 = indArray[i + 1]
      const v3 = indArray[i + 2]
      trianglesXml += `<triangle v1="${v1}" v2="${v2}" v3="${v3}" />\n`
    }
  } else {
    for (let i = 0; i < positions.count; i += 3) {
      trianglesXml += `<triangle v1="${i}" v2="${i + 1}" v3="${i + 2}" />\n`
    }
  }

  const modelXml = `<?xml version="1.0" encoding="UTF-8"?>
<model xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02" unit="millimeter" xml:lang="es">
  <metadata name="Author">SHAMMAH Clicker Studio</metadata>
  <metadata name="Description">Cherry MX Clicker generado profesionalmente</metadata>
  <resources>
    <object id="1" type="model" name="Clicker">
      <mesh>
        <vertices>
${verticesXml}        </vertices>
        <triangles>
${trianglesXml}        </triangles>
      </mesh>
    </object>
  </resources>
  <build>
    <item objectid="1" />
  </build>
</model>`

  const contentTypes = `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml" />
  <Default Extension="xml" ContentType="application/xml" />
  <Override PartName="/3D/model.model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml" />
</Types>`

  const rels = `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel" Target="3D/model.model" />
</Relationships>`

  const zip = new JSZip()
  zip.file('[Content_Types].xml', contentTypes)
  zip.folder('_rels')?.file('.rels', rels)
  zip.folder('3D')?.file('model.model', modelXml)

  const blob = await zip.generateAsync({ type: 'blob' })
  return blob
}
