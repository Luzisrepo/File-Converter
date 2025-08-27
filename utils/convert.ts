import { Action } from "@/types"
import { FFmpeg } from "@ffmpeg/ffmpeg"
import { fetchFile } from "@ffmpeg/util"

function getFileExtension(fileName: string): string {
  const match = fileName.match(/\.([^.]+)$/)
  return match ? match[1] : "" // Return file extension or empty string
}

function removeFileExtension(fileName: string): string {
  const lastDotIndex = fileName.lastIndexOf(".")
  return lastDotIndex !== -1 ? fileName.slice(0, lastDotIndex) : fileName // Return filename without extension
}

function getFFmpegCommand(
  input: string,
  output: string,
  format: string
): string[] {
  // Define format-specific settings
  const formatSettings: { [key: string]: string[] } = {
    "3gp": [
      "-r",
      "20",
      "-s",
      "352x288",
      "-vb",
      "400k",
      "-acodec",
      "aac",
      "-strict",
      "experimental",
      "-ac",
      "1",
      "-ar",
      "8000",
      "-ab",
      "24k",
    ],
    mp4: [
      "-movflags",
      "+faststart",
      "-c:v",
      "libx264",
      "-preset",
      "medium",
      "-crf",
      "23",
      "-c:a",
      "aac",
      "-b:a",
      "192k",
    ],
    mp3: ["-c:a", "libmp3lame", "-b:a", "192k"],
    wav: ["-c:a", "pcm_s16le", "-ar", "44100", "-ac", "2"],
    ogg: ["-c:a", "libvorbis", "-b:a", "192k"],
    flac: ["-c:a", "flac"],
    avi: ["-c:v", "libxvid", "-b:v", "1000k", "-c:a", "mp3"],
    mov: [
      "-c:v",
      "libx264",
      "-preset",
      "medium",
      "-crf",
      "23",
      "-c:a",
      "aac",
      "-b:a",
      "192k",
    ],
    webm: ["-c:v", "libvpx", "-b:v", "1000k", "-c:a", "libvorbis"],
    m4a: ["-c:a", "aac", "-b:a", "192k"],
    // Image formats
    jpeg: [
      "-q:v",
      "2", // Set quality (1-31, lower is better)
    ],
    jpg: [
      "-q:v",
      "2", // Set quality
    ],
    png: [
      "-pix_fmt",
      "rgb8", // PNG pixel format
    ],
    gif: ["-f", "gif"],
    bmp: ["-f", "bmp"],
    tiff: ["-f", "tiff"],
    // Add more formats and settings as needed
  }

  // Get the specific settings for the target format
  const specificSettings = formatSettings[format] || []
  return ["-i", input, ...specificSettings, output]
}

export function isConversionSupported(from: string, to: string): boolean {
  const rasterFormats = ["jpg", "jpeg", "png", "gif", "bmp", "tiff"]
  const vectorFormats = ["svg"]
  const audioFormats = ["mp3", "wav", "ogg", "aac", "flac", "m4a"]
  const videoFormats = ["mp4", "avi", "mov", "webm"]

  from = from.toLowerCase()
  to = to.toLowerCase()

  // Prevent conversion between raster and vector formats
  if (
    (rasterFormats.includes(from) && vectorFormats.includes(to)) ||
    (vectorFormats.includes(from) && rasterFormats.includes(to))
  ) {
    return false
  }

  // Prevent conversion between audio/video and image formats
  if (
    (audioFormats.includes(from) &&
      [...rasterFormats, ...vectorFormats].includes(to)) ||
    ([...rasterFormats, ...vectorFormats].includes(from) &&
      audioFormats.includes(to)) ||
    (videoFormats.includes(from) &&
      [...rasterFormats, ...vectorFormats, ...audioFormats].includes(to)) ||
    ([...rasterFormats, ...vectorFormats, ...audioFormats].includes(from) &&
      videoFormats.includes(to))
  ) {
    return false
  }

  return true
}

export default async function convert(ffmpeg: FFmpeg, action: Action) {
  const { file, to, file_name, file_type } = action
  const input = file_name
  const output = `${removeFileExtension(file_name)}.${to}`

  if (!isConversionSupported(getFileExtension(file_name), to as string)) {
    throw new Error(
      `Conversion from ${getFileExtension(file_name)} to ${to} is not supported.`
    )
  }

  try {
    // Write the input file to ffmpeg
    await ffmpeg.writeFile(input, await fetchFile(file))

    // Prepare the FFmpeg command
    const ffmpeg_cmd = getFFmpegCommand(input, output, to as string)

    // Execute the command
    await ffmpeg.exec(ffmpeg_cmd)

    // Read the output file
    const data = await ffmpeg.readFile(output)
    const blob = new Blob([data], { type: `${file_type.split("/")[0]}/${to}` })
    const url = URL.createObjectURL(blob)

    // Clean up: remove input and output files
    await ffmpeg.deleteFile(input)
    await ffmpeg.deleteFile(output)

    return { url, output }
  } catch (error) {
    console.error("Error in convert function:", error)
    throw error
  }
}
