import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Upload, Gem, Loader2 } from 'lucide-react';
import { analyzeImage } from '../lib/gemini';
import SupportBlock from '../components/SupportBlock';

// Default jewelry image path
const DEFAULT_IMAGE = "/default-jewelry.jpg";

// Default analysis for the jewelry
const DEFAULT_ANALYSIS = `1. Jewelry Identification:
- Type: Diamond Ring
- Style: Solitaire Engagement Ring
- Metal: 18K White Gold
- Primary Gemstone: Diamond (Round Brilliant Cut)
- Carat Weight: Approximately 1.25 carats
- Setting: 6-Prong Cathedral Setting

2. Gemstone & Metal Details:
- Diamond Quality: VS1-VS2 clarity, F-G color
- Diamond Characteristics: Excellent cut, high brilliance
- Metal Purity: 18K (75% gold)
- Band Width: Approximately 2mm
- Band Style: Polished finish with tapered shoulders
- Additional Features: Hidden halo of micro-pavé diamonds on basket

3. Craftsmanship & Design:
- Era/Period: Contemporary
- Design Origin: Classic American style
- Craftsmanship Level: High-quality commercial
- Manufacturing Method: Cast with hand-finished details
- Unique Details: Cathedral-style mounting increases perceived size
- Design Appeal: Timeless, elegant, high visual impact

4. Value & Quality Assessment:
- Estimated Retail Value: $8,000-$12,000 USD
- Quality Rating: High (8/10)
- Investment Potential: Good (diamonds retain value)
- Authenticity Marks: Should have stamp indicating 18K gold
- Quality Indicators: Well-proportioned diamond, even prongs, consistent metal finish
- Certification: Likely comes with GIA certification for center stone

5. Purchase & Care Information:
- Where to Buy Similar: Blue Nile, James Allen, Brilliant Earth, local jewelers
- Price Range: $6,500-$15,000 depending on exact diamond specifications
- Care Instructions: Clean with mild soap and soft brush, professional cleaning twice yearly
- Insurance Recommendation: Should be insured for full replacement value
- Common Issues: Prongs may need tightening over time
- Similar Alternatives: Platinum setting, different diamond shapes (oval, cushion)`;

export default function Home() {
  const [image, setImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Load default image and analysis without API call
    const loadDefaultContent = async () => {
      try {
        setLoading(true);
        const response = await fetch(DEFAULT_IMAGE);
        if (!response.ok) {
          throw new Error('Failed to load default image');
        }
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64data = reader.result as string;
          setImage(base64data);
          setAnalysis(DEFAULT_ANALYSIS);
          setLoading(false);
        };
        reader.onerror = () => {
          setError('Failed to load default image');
          setLoading(false);
        };
        reader.readAsDataURL(blob);
      } catch (err) {
        console.error('Error loading default image:', err);
        setError('Failed to load default image');
        setLoading(false);
      }
    };

    loadDefaultContent();
  }, []);

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file');
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setError('Image size should be less than 20MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setImage(base64String);
      setError(null);
      handleAnalyze(base64String);
    };
    reader.onerror = () => {
      setError('Failed to read the image file. Please try again.');
    };
    reader.readAsDataURL(file);

    // Reset the file input so the same file can be selected again
    e.target.value = '';
  }, []);

  const handleAnalyze = async (imageData: string) => {
    setLoading(true);
    setError(null);
    const jewelryPrompt = "Analyze this jewelry image and provide the following information:\n1. Jewelry identification (type, style, metal, primary gemstone, carat weight, setting)\n2. Gemstone and metal details (quality, characteristics, purity, dimensions, style, additional features)\n3. Craftsmanship and design (era/period, origin, craftsmanship level, manufacturing method, unique details, design appeal)\n4. Value and quality assessment (estimated retail value, quality rating, investment potential, authenticity marks, quality indicators, certification)\n5. Purchase and care information (where to buy similar, price range, care instructions, insurance recommendation, common issues, alternatives)\n\nThis is for informational purposes only.";
    try {
      const result = await analyzeImage(imageData, jewelryPrompt);
      setAnalysis(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to analyze image. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const formatAnalysis = (text: string) => {
    return text.split('\n').map((line, index) => {
      // Remove any markdown-style formatting
      const cleanLine = line.replace(/[*_#`]/g, '').trim();
      if (!cleanLine) return null;

      // Format section headers (lines starting with numbers)
      if (/^\d+\./.test(cleanLine)) {
        return (
          <div key={index} className="mt-8 first:mt-0">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              {cleanLine.replace(/^\d+\.\s*/, '')}
            </h3>
          </div>
        );
      }
      
      // Format list items with specific properties
      if (cleanLine.startsWith('-') && cleanLine.includes(':')) {
        const [label, ...valueParts] = cleanLine.substring(1).split(':');
        const value = valueParts.join(':').trim();
        return (
          <div key={index} className="flex gap-2 mb-3 ml-4">
            <span className="font-semibold text-gray-800 min-w-[120px]">{label.trim()}:</span>
            <span className="text-gray-700">{value}</span>
          </div>
        );
      }
      
      // Format regular list items
      if (cleanLine.startsWith('-')) {
        return (
          <div key={index} className="flex gap-2 mb-3 ml-4">
            <span className="text-gray-400">•</span>
            <span className="text-gray-700">{cleanLine.substring(1).trim()}</span>
          </div>
        );
      }

      // Regular text
      return (
        <p key={index} className="mb-3 text-gray-700">
          {cleanLine}
        </p>
      );
    }).filter(Boolean);
  };

  return (
    <div className="bg-gray-50 py-6 sm:py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Free Jewelry Identifier</h1>
          <p className="text-base sm:text-lg text-gray-600">Upload a jewelry photo for gemstone identification and valuation information</p>
        </div>

        <div className="mt-8 bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-12">
          <div className="flex flex-col items-center justify-center mb-6">
            <label 
              htmlFor="image-upload"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer w-full sm:w-auto"
            >
              <Upload className="h-5 w-5" />
              Upload Jewelry Photo
              <input
                ref={fileInputRef}
                id="image-upload"
                type="file"
                className="hidden"
                accept="image/jpeg,image/png,image/jpg,image/webp"
                onChange={handleImageUpload}
              />
            </label>
            <p className="mt-2 text-sm text-gray-500">PNG, JPG, JPEG or WEBP (MAX. 20MB)</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 rounded-md">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {loading && !image && (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
              <span className="ml-2 text-gray-600">Loading...</span>
            </div>
          )}

          {image && (
            <div className="mb-6">
              <div className="relative rounded-lg mb-4 overflow-hidden bg-gray-100">
                <img
                  src={image}
                  alt="Jewelry preview"
                  className="w-full h-auto max-h-[500px] object-contain mx-auto"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleAnalyze(image)}
                  disabled={loading}
                  className="flex items-center justify-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Gem className="-ml-1 mr-2 h-5 w-5" />
                      Identify Jewelry
                    </>
                  )}
                </button>
                <button
                  onClick={triggerFileInput}
                  className="flex items-center justify-center px-4 py-2 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Upload className="mr-2 h-5 w-5" />
                  Upload Another Photo
                </button>
              </div>
            </div>
          )}

          {analysis && (
            <div className="bg-gray-50 rounded-lg p-6 sm:p-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Jewelry Analysis Results</h2>
              <div className="text-gray-700">
                {formatAnalysis(analysis)}
              </div>
            </div>
          )}
        </div>

        <SupportBlock />

        <div className="prose max-w-none my-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8">Free Jewelry Identifier: Your Ultimate Gemstone Recognition Tool</h2>
          
          <p>Welcome to our free jewelry identifier tool, powered by advanced artificial intelligence technology.
             This tool helps you identify jewelry pieces and gemstones, providing essential information about materials,
             craftsmanship, estimated value, and where to purchase similar items.</p>

          <h3>How Our Jewelry Identifier Works</h3>
          <p>Our tool uses AI to analyze jewelry photos and provide detailed information about the pieces.
             Simply upload a clear photo of a ring, necklace, bracelet, or other jewelry item, and our AI will help you identify its 
             components, gemstones, and key details to help with valuation and purchasing decisions.</p>

          <h3>Key Features of Our Jewelry Identifier</h3>
          <ul>
            <li>Comprehensive gemstone and metal recognition</li>
            <li>Detailed craftsmanship and design analysis</li>
            <li>Quality and authenticity assessment</li>
            <li>Value estimation and pricing information</li>
            <li>Shopping recommendations and care instructions</li>
            <li>100% free to use</li>
          </ul>

          <h3>Perfect For:</h3>
          <ul>
            <li>Jewelry enthusiasts and collectors</li>
            <li>Potential buyers researching jewelry pieces</li>
            <li>Finding information about family heirlooms</li>
            <li>Discovering where to purchase similar jewelry</li>
            <li>Learning about gemstone quality and value factors</li>
          </ul>

          <p>Try our free jewelry identifier today and discover everything about your favorite pieces!
             No registration required - just upload a photo and start learning about jewelry from around the world.</p>
        </div>

        <SupportBlock />
      </div>
    </div>
  );
}