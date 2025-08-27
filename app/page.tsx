import Dropzone from "@/components/dropzone"

export default function Home() {
  return (
    <div className="mx-auto flex flex-col justify-center space-y-16 pb-8 text-center">
      <div className="space-y-6">
        <h1 className="text-4xl font-bold text-primary md:text-6xl">
          Ray File Converter
        </h1>
        <p className="mx-auto max-w-2xl text-xl text-muted-foreground">
          Convert your files instantly, for free, and without limits. Transform
          images, audio, and videos effortlessly with FluxLura!
        </p>
      </div>
      <Dropzone />
    </div>
  )
}
