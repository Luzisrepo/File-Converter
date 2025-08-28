"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { Action } from "@/types"
import bytesToSize from "@/utils/bytes-to-size"
import compressFileName from "@/utils/compress-file-name"
import convert, { isConversionSupported } from "@/utils/convert"
import loadFfmpeg from "@/utils/load-ffmpeg"
import type { FFmpeg } from "@ffmpeg/ffmpeg"
import {
  AlertTriangle,
  Download,
  Loader2,
  RotateCw,
  Trash2,
  Upload,
} from "lucide-react"
import { useDropzone } from "react-dropzone"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { useToast } from "../hooks/use-toast"
import fileToIcon from "../utils/file-to-icon"

const FILE_TYPES: Record<string, string[]> = {
  image: [
    "jpg",
    "jpeg",
    "png",
    "gif",
    "webp",
    "ico",
    "tif",
    "svg",
    "raw",
  ],
  video: [
    "mp4",
    "m4v",
    "mp4v",
    "3gp",
    "3g2",
    "avi",
    "mov",
    "wmv",
    "mkv",
    "flv",
    "ogv",
    "webm",
    "h264",
    "264",
    "hevc",
    "265",
  ],
  audio: ["mp3", "wav", "ogg", "aac", "wma", "flac", "m4a"],
}

export default function EnhancedFileConverter() {
  const { toast } = useToast()
  const [file, setFile] = useState<File | null>(null)
  const [fileDetails, setFileDetails] = useState<Action | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isConverting, setIsConverting] = useState(false)
  const [conversionProgress, setConversionProgress] = useState(0)
  const [convertedFile, setConvertedFile] = useState<{
    url: string
    output: string
  } | null>(null)
  const ffmpegRef = useRef<FFmpeg | null>(null)

  useEffect(() => {
    loadFfmpeg().then((ffmpeg) => {
      ffmpegRef.current = ffmpeg
      setIsLoaded(true)
    })
  }, [])

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        const selectedFile = acceptedFiles[0]
        setFile(selectedFile)
        setFileDetails({
          file: selectedFile,
          file_name: selectedFile.name,
          file_size: selectedFile.size,
          file_type: selectedFile.type,
          from: selectedFile.name.split(".").pop() || "",
          to: "",
          is_converted: false,
          is_converting: false,
          is_error: false,
        })
        toast({
          title: "File added",
          description: `${selectedFile.name} has been added for conversion.`,
        })
      }
    },
    [toast]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: Object.entries(FILE_TYPES).reduce(
      (acc, [type, exts]) => {
        acc[`${type}/*`] = exts.map((ext) => `.${ext}`)
        return acc
      },
      {} as Record<string, string[]>
    ),
    multiple: false,
  })

  const updateConversionFormat = useCallback((to: string) => {
    setFileDetails((prev) => (prev ? { ...prev, to } : null))
  }, [])

  const deleteFile = useCallback(() => {
    setFile(null)
    setFileDetails(null)
    setConvertedFile(null)
    toast({
      title: "File removed",
      description: "The file has been removed from the conversion list.",
    })
  }, [toast])

  const convertFile = async () => {
    if (!file || !fileDetails || !fileDetails.to || !ffmpegRef.current) return

    setIsConverting(true)
    setConversionProgress(0)

    const startTime = Date.now()

    try {
      const result = await convert(ffmpegRef.current, fileDetails)

      // Ensure the conversion takes at least 2 seconds
      const elapsedTime = Date.now() - startTime
      if (elapsedTime < 2000) {
        await new Promise((resolve) => setTimeout(resolve, 2000 - elapsedTime))
      }

      setConvertedFile(result)
      toast({
        title: "Conversion Complete",
        description: "Your file has been converted successfully.",
      })
    } catch (error) {
      console.error("Conversion error:", error)
      let errorMessage = "An unexpected error occurred during conversion."
      if (error instanceof Error) {
        errorMessage = error.message
      }
      toast({
        title: "Conversion Error",
        description: errorMessage,
        variant: "destructive",
      })
      setFileDetails((prev) => (prev ? { ...prev, is_error: true } : null))
    }

    setIsConverting(false)
    setConversionProgress(100)
  }

  const reset = useCallback(() => {
    setFile(null)
    setFileDetails(null)
    setConvertedFile(null)
    setIsConverting(false)
    setConversionProgress(0)
    toast({
      title: "Reset",
      description: "The conversion has been reset.",
    })
  }, [toast])

  const download = useCallback(() => {
    if (convertedFile) {
      const a = document.createElement("a")
      a.href = convertedFile.url
      a.download = convertedFile.output
      a.click()
      toast({
        title: "Download Started",
        description: "Your converted file is being downloaded.",
      })
    }
  }, [convertedFile, toast])

  return (
    <Card className="mx-auto w-full max-w-xl">
      <CardHeader></CardHeader>
      <CardContent className="w-full">
        {!file ? (
          <div
            {...getRootProps()}
            className={`flex w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed bg-muted/50 p-10 transition-colors duration-200 ease-in-out hover:bg-muted/65 ${
              isDragActive ? "border-primary/90" : "border-muted-foreground/25"
            }`}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <Upload size={48} className="text-muted-foreground" />
              <div>
                <p className="text-lg font-semibold">
                  Drag & drop a file here, or click to select a file
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Supported formats: Images, Audio, and Video
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full space-y-4">
            <div className="flex items-center justify-between rounded-lg bg-muted p-4">
              <div className="flex items-center space-x-4">
                <div className="rounded-full bg-background p-2">
                  {fileToIcon(fileDetails?.file_type || "")}
                </div>
               
                  <p className="font-medium">
                    {compressFileName(fileDetails?.file_name || "")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {bytesToSize(fileDetails?.file_size || 0)}
                  </p>
                
              </div>
              {!convertedFile && !isConverting && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={deleteFile}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 size={18} />
                </Button>
              )}
            </div>

            {!convertedFile && !isConverting && (
              <div className="space-y-2">
                <label htmlFor="format">Convert to</label>
                <Select
                  onValueChange={updateConversionFormat}
                  value={fileDetails?.to || undefined}
                >
                  <SelectTrigger id="format">
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    {(
                      FILE_TYPES[fileDetails?.file_type.split("/")[0] || ""] ||
                      []
                    )
                      .filter((ext) =>
                        isConversionSupported(fileDetails?.from || "", ext)
                      )
                      .map((ext) => (
                        <SelectItem key={ext} value={ext}>
                          {ext.toUpperCase()}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {(isConverting || convertedFile) && (
              <Progress
                value={convertedFile ? 100 : conversionProgress}
                className="w-full"
              />
            )}

            {fileDetails &&
              (FILE_TYPES[fileDetails.file_type.split("/")[0]] || []).filter(
                (ext) => isConversionSupported(fileDetails.from, ext)
              ).length === 0 && (
                <Card>
                  <AlertTriangle className="size-4" />
                  <CardTitle>Conversion not supported</CardTitle>
                  <CardContent>
                    There are no supported conversion options for this file
                    type.
                  </CardContent>
                </Card>
              )}
          </div>
        )}
      </CardContent>
      {file && (
        <CardFooter className="flex w-full justify-end space-x-4">
          {convertedFile && (
            <Button
              onClick={download}
              className="bg-primary hover:bg-primary/90"
            >
              <Download size={18} className="mr-2" />
              Download
            </Button>
          )}
          <Button onClick={reset} variant="outline">
            Reset
          </Button>
          {!convertedFile && (
            <Button
              onClick={convertFile}
              disabled={!isLoaded || isConverting || !fileDetails?.to}
              className={`${
                isConverting
                  ? "bg-yellow-500 hover:bg-yellow-600"
                  : "bg-primary hover:bg-primary/90"
              }`}
            >
              {isConverting ? (
                <>
                  <Loader2 size={18} className="mr-2 animate-spin" />
                  Converting...
                </>
              ) : (
                <>
                  <RotateCw size={18} className="mr-2" />
                  Convert Now
                </>
              )}
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  )
}
