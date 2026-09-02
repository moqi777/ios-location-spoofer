import Foundation
import AppKit

// 在截图上画序号圆点。用法：badge in.png out.png r "x,y,文字" ...
let a = CommandLine.arguments
guard a.count >= 4, let src = NSImage(contentsOfFile: a[1]),
      let tiff = src.tiffRepresentation, let base = NSBitmapImageRep(data: tiff) else {
    FileHandle.standardError.write("bad input\n".data(using: .utf8)!); exit(1)
}
let w = base.pixelsWide, h = base.pixelsHigh
let r = CGFloat(Double(a[3]) ?? 16)

let out = NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: w, pixelsHigh: h,
    bitsPerSample: 8, samplesPerPixel: 4, hasAlpha: true, isPlanar: false,
    colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0)!
NSGraphicsContext.saveGraphicsState()
NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: out)
base.draw(in: NSRect(x: 0, y: 0, width: w, height: h))

for spec in a.dropFirst(4) {
    let p = spec.split(separator: ",").map(String.init)
    guard p.count == 3, let x = Double(p[0]), let y = Double(p[1]) else { continue }
    // 传进来的 y 是从顶部算的，Cocoa 的原点在左下角
    let cx = CGFloat(x), cy = CGFloat(Double(h) - y)
    let circle = NSBezierPath(ovalIn: NSRect(x: cx - r, y: cy - r, width: r * 2, height: r * 2))
    NSColor.white.setStroke()
    circle.lineWidth = r * 0.16
    NSColor(red: 1.0, green: 0.23, blue: 0.19, alpha: 1).setFill()
    circle.fill()
    circle.stroke()
    let font = NSFont.boldSystemFont(ofSize: r * 1.25)
    let attrs: [NSAttributedString.Key: Any] = [.font: font, .foregroundColor: NSColor.white]
    let s = p[2] as NSString
    let sz = s.size(withAttributes: attrs)
    s.draw(at: NSPoint(x: cx - sz.width / 2, y: cy - sz.height / 2), withAttributes: attrs)
}
NSGraphicsContext.restoreGraphicsState()
try! out.representation(using: .png, properties: [:])!.write(to: URL(fileURLWithPath: a[2]))
