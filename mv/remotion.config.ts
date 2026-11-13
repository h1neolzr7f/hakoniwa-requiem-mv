import {Config} from '@remotion/cli/config';

// No GPU on the render host: SwiftShader through ANGLE gives WebGL2 for the depth shader.
Config.setChromiumOpenGlRenderer('swangle');
Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(94);
Config.setCodec('h264');
Config.setCrf(15);
Config.setPixelFormat('yuv420p');
Config.setConcurrency(4);
Config.setDelayRenderTimeoutInMilliseconds(120000);
