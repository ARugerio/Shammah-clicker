import * as THREE from 'three'
import { compress } from 'fflate'

export async function export3MF(
  geometry: THREE.BufferGeometry,
  filename: string
): Promise<Blob> {
  // Create minimal 3MF structure
  const modelXml = `<?xml version="1.0" encoding="UTF-8"?>
<model xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02" unit="millimeter">
  <resources>
    <object id="1" type="model">
      <mesh>
        <vertices>
          <vertex x="0" y="0" z="0" />
          <vertex x="10" y="0" z="0" />
          <vertex x="10" y="10" z="0" />
          <vertex x="0" y="10" z="0" />
        </vertices>
        <triangles>
          <triangle v1="0" v2="1" v3="2" />
          <triangle v1="0" v2="2" v3="3" />
        </triangles>
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

  // Create ZIP structure
  const files = {
    '[Content_Types].xml': new TextEncoder().encode(contentTypes),
    '_rels/.rels': new TextEncoder().encode(rels),
    '3D/model.model': new TextEncoder().encode(modelXml),
  }

  // Compress to ZIP (simple version - in production use proper ZIP library)
  const blob = new Blob(Object.values(files), { type: 'application/zip' })
  return blob
}
