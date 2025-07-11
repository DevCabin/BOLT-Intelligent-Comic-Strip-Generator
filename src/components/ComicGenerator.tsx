import React, { useState, useEffect } from 'react';
import { Plus, Download, Check, Edit3, Upload, Trash2, Zap, AlertCircle } from 'lucide-react';
import { generateImage, isOpenAIConfigured } from '../services/openai';

interface Frame {
  id: string;
  imageUrl: string;
  description: string;
  isFinalized: boolean;
  order: number;
}

interface Project {
  id: string;
  name: string;
  frames: Frame[];
  createdAt: Date;
  lastModified: Date;
}

export default function ComicGenerator() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [currentFrame, setCurrentFrame] = useState<Frame | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [description, setDescription] = useState('');
  const [editingDescription, setEditingDescription] = useState('');
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isAIEnabled, setIsAIEnabled] = useState(false);
  const [selectedModel, setSelectedModel] = useState<'dall-e-2' | 'dall-e-3'>('dall-e-2');
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [baseStylePrompt, setBaseStylePrompt] = useState<string>('');
  const [characterDescription, setCharacterDescription] = useState<string>('');
  const [masterStyleTemplate, setMasterStyleTemplate] = useState<string>('');
  const [showStyleSetup, setShowStyleSetup] = useState(false);

  // Check if OpenAI is configured on mount
  useEffect(() => {
    setIsAIEnabled(isOpenAIConfigured());
  }, []);

  // Load projects from localStorage on component mount
  useEffect(() => {
    const savedProjects = localStorage.getItem('comic-projects');
    if (savedProjects) {
      const parsedProjects = JSON.parse(savedProjects).map((p: any) => ({
        ...p,
        createdAt: new Date(p.createdAt),
        lastModified: new Date(p.lastModified)
      }));
      setProjects(parsedProjects);
    }
  }, []);

  // Save projects to localStorage whenever projects change
  useEffect(() => {
    localStorage.setItem('comic-projects', JSON.stringify(projects));
  }, [projects]);

  const createNewProject = () => {
    if (!newProjectName.trim()) return;
    
    const newProject: Project = {
      id: Date.now().toString(),
      name: newProjectName,
      frames: [],
      createdAt: new Date(),
      lastModified: new Date()
    };
    
    setProjects([...projects, newProject]);
    setCurrentProject(newProject);
    setNewProjectName('');
    setShowProjectModal(false);
  };

  const selectProject = (project: Project) => {
    setCurrentProject(project);
    setCurrentFrame(null);
    setDescription('');
  };

  const deleteProject = (projectId: string) => {
    setProjects(projects.filter(p => p.id !== projectId));
    if (currentProject?.id === projectId) {
      setCurrentProject(null);
      setCurrentFrame(null);
    }
  };

  const simulateImageGeneration = async (desc: string): Promise<string> => {
    if (isAIEnabled) {
      // Use real AI generation
      try {
        setError(null);
        
        // Build comprehensive style-consistent prompt
        let enhancedPrompt = desc;
        
        // Add style consistency for subsequent frames
        if (currentProject && currentProject.frames.length > 0) {
          // Use the master style template with the new scene description
          enhancedPrompt = `${masterStyleTemplate} NEW SCENE: ${desc}`;
        }
        
        return await generateImage({
          prompt: enhancedPrompt,
          size: selectedModel === 'dall-e-3' ? '1024x1024' : '512x512',
          model: selectedModel,
        });
      } catch (error) {
        console.error('AI generation failed:', error);
        setError(error instanceof Error ? error.message : 'Failed to generate image');
        // Fall back to placeholder
        return getFallbackPlaceholder(desc);
      }
    } else {
      // Use placeholder images
      await new Promise(resolve => setTimeout(resolve, 2000));
      return getFallbackPlaceholder(desc);
    }
  };

  const getFallbackPlaceholder = (description: string): string => {
    const lowerDesc = description.toLowerCase();
    
    // Check for key themes and return appropriate placeholder
    if (lowerDesc.includes('ninja') || lowerDesc.includes('cat') || lowerDesc.includes('night') || lowerDesc.includes('moon')) {
      return 'https://images.pexels.com/photos/1002638/pexels-photo-1002638.jpeg?auto=compress&cs=tinysrgb&w=800'; // Night scene
    } else if (lowerDesc.includes('forest') || lowerDesc.includes('tree') || lowerDesc.includes('nature')) {
      return 'https://images.pexels.com/photos/1496373/pexels-photo-1496373.jpeg?auto=compress&cs=tinysrgb&w=800'; // Forest
    } else if (lowerDesc.includes('city') || lowerDesc.includes('urban') || lowerDesc.includes('building')) {
      return 'https://images.pexels.com/photos/1519088/pexels-photo-1519088.jpeg?auto=compress&cs=tinysrgb&w=800'; // City
    } else if (lowerDesc.includes('mountain') || lowerDesc.includes('landscape')) {
      return 'https://images.pexels.com/photos/1624496/pexels-photo-1624496.jpeg?auto=compress&cs=tinysrgb&w=800'; // Mountain
    } else if (lowerDesc.includes('ocean') || lowerDesc.includes('sea') || lowerDesc.includes('water')) {
      return 'https://images.pexels.com/photos/1001682/pexels-photo-1001682.jpeg?auto=compress&cs=tinysrgb&w=800'; // Ocean
    } else {
      // Default artistic/abstract images for comic-style content
      const defaultImages = [
        'https://images.pexels.com/photos/1496373/pexels-photo-1496373.jpeg?auto=compress&cs=tinysrgb&w=800',
        'https://images.pexels.com/photos/1002638/pexels-photo-1002638.jpeg?auto=compress&cs=tinysrgb&w=800',
        'https://images.pexels.com/photos/1519088/pexels-photo-1519088.jpeg?auto=compress&cs=tinysrgb&w=800'
      ];
      return defaultImages[Math.floor(Math.random() * defaultImages.length)];
    }
  };

  const generateFrame = async () => {
    if (!currentProject || !description.trim()) return;
    
    setIsGenerating(true);
    
    try {
      const imageUrl = await simulateImageGeneration(description);
      
      const newFrame: Frame = {
        id: Date.now().toString(),
        imageUrl,
        description: description,
        isFinalized: false,
        order: currentProject.frames.length + 1
      };
      
      setCurrentFrame(newFrame);
      setEditingDescription(description);
    } catch (error) {
      console.error('Error generating frame:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const regenerateFrame = async () => {
    if (!currentFrame || !editingDescription.trim()) return;
    
    setIsGenerating(true);
    
    try {
      const imageUrl = await simulateImageGeneration(editingDescription);
      setCurrentFrame({
        ...currentFrame,
        imageUrl,
        description: editingDescription
      });
    } catch (error) {
      console.error('Error regenerating frame:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const finalizeFrame = () => {
    if (!currentProject || !currentFrame) return;
    
    // If this is the first frame, create the master style template
    if (currentProject.frames.length === 0) {
      // Create a comprehensive master template from the first frame
      const masterTemplate = `MASTER STYLE TEMPLATE: ${currentFrame.description}. This establishes the definitive art style, character design, color scheme, and visual aesthetic for this entire comic strip series.`;
      setMasterStyleTemplate(masterTemplate);
      
      // Extract key elements for display
      const desc = currentFrame.description.toLowerCase();
      setBaseStylePrompt(currentFrame.description);
      
      // Extract character info for user guidance
      if (desc.includes('ninja') || desc.includes('character') || desc.includes('person') || desc.includes('man') || desc.includes('woman')) {
        const words = currentFrame.description.split(' ');
        const characterHints = words.slice(0, 10).join(' '); // First part usually describes the character
        setCharacterDescription(characterHints);
      }
    }
    
    const finalizedFrame = { ...currentFrame, isFinalized: true };
    const updatedProject = {
      ...currentProject,
      frames: [...currentProject.frames, finalizedFrame],
      lastModified: new Date()
    };
    
    setProjects(projects.map(p => p.id === currentProject.id ? updatedProject : p));
    setCurrentProject(updatedProject);
    setCurrentFrame(null);
    setDescription('');
    setEditingDescription('');
  };

  const downloadFrame = (frame: Frame) => {
    // In a real implementation, this would trigger a download
    const link = document.createElement('a');
    link.href = frame.imageUrl;
    link.download = `frame-${frame.order}.jpg`;
    link.click();
  };

  const downloadAllFrames = () => {
    if (!currentProject || currentProject.frames.length === 0) return;
    
    currentProject.frames.forEach((frame, index) => {
      setTimeout(() => {
        const link = document.createElement('a');
        link.href = frame.imageUrl;
        link.download = `${currentProject.name}-frame-${String(index + 1).padStart(2, '0')}.jpg`;
        link.click();
      }, index * 500); // Stagger downloads
    });
  };

  const deleteFrame = (frameId: string) => {
    if (!currentProject) return;
    
    const updatedFrames = currentProject.frames.filter(f => f.id !== frameId);
    // Reorder remaining frames
    const reorderedFrames = updatedFrames.map((frame, index) => ({
      ...frame,
      order: index + 1
    }));
    
    const updatedProject = {
      ...currentProject,
      frames: reorderedFrames,
      lastModified: new Date()
    };
    
    setProjects(projects.map(p => p.id === currentProject.id ? updatedProject : p));
    setCurrentProject(updatedProject);
    
    // Reset style if no frames left
    if (reorderedFrames.length === 0) {
      setBaseStylePrompt('');
      setCharacterDescription('');
      setMasterStyleTemplate('');
      setReferenceImage(null);
    }
  };

  const handleReferenceUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        setReferenceImage(imageUrl);
        // When reference image is uploaded, it becomes the master template
        const referenceTemplate = 'MASTER STYLE TEMPLATE: Match the exact art style, character design, color scheme, line weight, shading technique, and visual aesthetic shown in the reference image. Maintain absolute consistency with this established style.';
        setMasterStyleTemplate(referenceTemplate);
        setBaseStylePrompt('Reference image uploaded - style locked');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleStyleSetup = () => {
    setShowStyleSetup(true);
  };

  const saveCustomStyle = (styleDescription: string, characterDesc: string) => {
    const customTemplate = `MASTER STYLE TEMPLATE: ${styleDescription}. Character: ${characterDesc}. This establishes the definitive art style, character design, and visual aesthetic for this entire comic strip series.`;
    setMasterStyleTemplate(customTemplate);
    setBaseStylePrompt(styleDescription);
    setCharacterDescription(characterDesc);
    setShowStyleSetup(false);
  };
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          {/* Title Row */}
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
              Manga Strip Generator
            </h1>
            <div className="flex items-center justify-center gap-2">
              {isAIEnabled ? (
                <div className="flex items-center gap-2 text-emerald-400 text-sm">
                  <Zap size={16} />
                  <span>AI-Powered Comic Strip Generation</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-amber-400 text-sm">
                  <AlertCircle size={16} />
                  <span>Demo Mode - Add OpenAI API key for AI comic generation</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Options Row */}
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => setShowProjectModal(true)}
              className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Plus size={20} />
              New Project
            </button>
            <button
              onClick={handleStyleSetup}
              className="bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Edit3 size={20} />
              Setup Style
            </button>
            <label className="bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors cursor-pointer">
              <Upload size={20} />
              Style Reference
              <input
                type="file"
                accept="image/*"
                onChange={handleReferenceUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Project Grid */}
        {!currentProject && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {projects.map(project => (
              <div key={project.id} className="bg-gray-800 rounded-lg p-6 hover:bg-gray-750 transition-colors">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-semibold">{project.name}</h3>
                  <button
                    onClick={() => deleteProject(project.id)}
                    className="text-red-400 hover:text-red-300 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                <p className="text-gray-400 mb-4">{project.frames.length} frames</p>
                <p className="text-sm text-gray-500 mb-4">
                  Last modified: {project.lastModified.toLocaleDateString()}
                </p>
                <button
                  onClick={() => selectProject(project)}
                  className="w-full bg-purple-600 hover:bg-purple-700 py-2 rounded-lg transition-colors"
                >
                  Open Project
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Current Project View */}
        {currentProject && (
          <div className="space-y-8">
            {/* Project Header */}
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">{currentProject.name}</h2>
              <div className="flex gap-4">
                <button
                  onClick={handleStyleSetup}
                  className="bg-indigo-600 hover:bg-indigo-700 px-3 py-1 rounded-lg flex items-center gap-2 transition-colors text-sm"
                >
                  <Edit3 size={16} />
                  Edit Style
                </button>
                <button
                  onClick={() => setCurrentProject(null)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Back to Projects
                </button>
              </div>
            </div>

            {/* Style Status Display */}
            {(masterStyleTemplate || referenceImage) && (
              <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full mt-1 flex-shrink-0"></div>
                  <div className="flex-1">
                    <div className="font-medium text-emerald-400 mb-2">
                      🎨 Style Consistency Active
                    </div>
                    <div className="text-sm text-gray-300 mb-2">
                      All new frames will automatically match your established style and character design.
                    </div>
                    {referenceImage && (
                      <div className="flex items-center gap-2 mb-2">
                        <img src={referenceImage} alt="Style reference" className="w-12 h-12 object-cover rounded" />
                        <span className="text-xs text-gray-400">Reference image active</span>
                      </div>
                    )}
                    {baseStylePrompt && !referenceImage && (
                      <div className="text-xs text-gray-400 bg-gray-800 rounded p-2 font-mono">
                        "{baseStylePrompt.substring(0, 100)}..."
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setReferenceImage(null);
                      setBaseStylePrompt('');
                      setCharacterDescription('');
                      setMasterStyleTemplate('');
                    }}
                    className="text-gray-400 hover:text-red-400 transition-colors"
                    title="Reset style"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* Frame Generation Area */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4">
                {!masterStyleTemplate && currentProject.frames.length === 0 
                  ? 'Create First Frame (This Will Lock Your Style)' 
                  : `Create Frame ${currentProject.frames.length + 1}`}
              </h3>
              
              {/* Warning for first frame */}
              {!masterStyleTemplate && currentProject.frames.length === 0 && (
                <div className="mb-4 p-3 bg-amber-900/20 border border-amber-500/30 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle size={16} className="text-amber-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-sm font-medium text-amber-400 mb-1">
                        First Frame Sets Your Style
                      </div>
                      <div className="text-xs text-gray-300">
                        Be very specific about your character's appearance, art style, and color scheme. 
                        This description will be used to maintain consistency across all future frames.
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="space-y-4">
                {/* Error Display */}
                {error && (
                  <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-red-400 text-sm">
                      <AlertCircle size={16} />
                      <span>{error}</span>
                    </div>
                  </div>
                )}

                {/* Model Selection */}
                {isAIEnabled && (
                  <div className="bg-gray-700 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-300 mb-3">AI Model Selection</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setSelectedModel('dall-e-2')}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          selectedModel === 'dall-e-2'
                            ? 'border-purple-500 bg-purple-500/10'
                            : 'border-gray-600 hover:border-gray-500'
                        }`}
                      >
                        <div className="text-left">
                          <div className="font-medium text-white">DALL-E 2</div>
                          <div className="text-xs text-gray-400 mt-1">$0.020 per image</div>
                          <div className="text-xs text-gray-500 mt-1">512×512 resolution</div>
                        </div>
                      </button>
                      <button
                        onClick={() => setSelectedModel('dall-e-3')}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          selectedModel === 'dall-e-3'
                            ? 'border-purple-500 bg-purple-500/10'
                            : 'border-gray-600 hover:border-gray-500'
                        }`}
                      >
                        <div className="text-left">
                          <div className="font-medium text-white">DALL-E 3</div>
                          <div className="text-xs text-gray-400 mt-1">$0.040 per image</div>
                          <div className="text-xs text-gray-500 mt-1">1024×1024 resolution</div>
                        </div>
                      </button>
                    </div>
                    <div className="mt-3 p-2 bg-gray-800 rounded border-l-4 border-blue-500">
                      <div className="text-xs text-gray-300">
                        <div className="font-medium text-blue-400 mb-1">Currently Selected: {selectedModel.toUpperCase()}</div>
                        {selectedModel === 'dall-e-3' ? (
                          <div>
                            <div>• Higher quality and better prompt understanding</div>
                            <div>• Minimum resolution: 1024×1024 (4x larger than DALL-E 2)</div>
                            <div>• 2x cost but significantly better anime/manga style results</div>
                          </div>
                        ) : (
                          <div>
                            <div>• More affordable option at 512×512 resolution</div>
                            <div>• Good for rapid prototyping and testing ideas</div>
                            <div>• Half the cost of DALL-E 3</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <textarea
                  value={currentFrame ? editingDescription : description}
                  onChange={(e) => currentFrame ? setEditingDescription(e.target.value) : setDescription(e.target.value)}
                  placeholder={currentProject.frames.length === 0 
                    ? "Describe your first comic frame in detail (this locks your style): A black and white manga-style ninja with cat-like features, wearing dark clothing, standing in a moonlit forest..."
                    : masterStyleTemplate
                      ? "Describe the next scene: The same character now moves to a different location, or performs a new action..."
                      : "Describe the next comic frame: What happens next in your story?"
                  }
                  className="w-full h-32 bg-gray-700 rounded-lg p-4 text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
                  disabled={isGenerating}
                />
                
                <div className="flex gap-4">
                  {!currentFrame ? (
                    <button
                      onClick={generateFrame}
                      disabled={isGenerating || !description.trim()}
                      className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-6 py-2 rounded-lg transition-colors flex items-center gap-2"
                    >
                      {isAIEnabled ? <Zap size={18} /> : <Edit3 size={18} />}
                      {isGenerating ? 'Generating...' : 'Generate Frame'}
                    </button>
                  ) : (
                    <div className="flex gap-4">
                      <button
                        onClick={regenerateFrame}
                        disabled={isGenerating || !editingDescription.trim()}
                        className="bg-amber-600 hover:bg-amber-700 disabled:bg-gray-600 px-6 py-2 rounded-lg transition-colors flex items-center gap-2"
                      >
                        {isAIEnabled ? <Zap size={18} /> : <Edit3 size={18} />}
                        {isGenerating ? 'Regenerating...' : 'Regenerate'}
                      </button>
                      <button
                        onClick={finalizeFrame}
                        disabled={isGenerating}
                        className="bg-emerald-600 hover:bg-emerald-700 px-6 py-2 rounded-lg transition-colors flex items-center gap-2"
                      >
                        Finalize & Next
                        <Check size={18} />
                      </button>
                    </div>
                  )}
                </div>
                
                {/* Help text for refinement */}
                {currentFrame && (
                  <div className="text-sm text-gray-400 bg-gray-800 rounded-lg p-3 border-l-4 border-purple-500">
                    <div className="flex items-start gap-2">
                      {isAIEnabled ? (
                        <Zap size={16} className="text-purple-400 mt-0.5 flex-shrink-0" />
                      ) : (
                        <Edit3 size={16} className="text-purple-400 mt-0.5 flex-shrink-0" />
                      )}
                      <div>
                        <p className="font-medium text-purple-400 mb-1">
                          {isAIEnabled ? 'AI-Powered Comic Generation' : 'Refine Your Comic Frame'}
                        </p>
                        <p>Edit the description above to refine your comic frame. You can:</p>
                        <ul className="list-disc list-inside mt-1 space-y-0.5 text-xs">
                          <li>Focus on character actions and story progression</li>
                          <li>Use "the character" or "the same character" to reference your established character</li>
                          <li>Describe new scenes and actions while maintaining character identity</li>
                          <li>Consider panel-to-panel flow and pacing</li>
                          {masterStyleTemplate && <li>Style and character consistency is automatically enforced</li>}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Generated Image Preview */}
              {currentFrame && (
                <div className="mt-6 bg-gray-700 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-lg font-semibold">Generated Frame</h4>
                    <div className="flex gap-2">
                      <button
                        onClick={() => downloadFrame(currentFrame)}
                        className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                      >
                        <Download size={18} />
                        Download
                      </button>
                    </div>
                  </div>
                  <div className="aspect-video bg-gray-600 rounded-lg overflow-hidden">
                    <img
                      src={currentFrame.imageUrl}
                      alt="Generated frame"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="mt-3 p-3 bg-gray-800 rounded-lg">
                    <p className="text-sm text-gray-400 mb-1">Current Description:</p>
                    <p className="text-gray-200">{currentFrame.description}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Existing Frames */}
            {currentProject.frames.length > 0 && (
              <>
                <div className="bg-gray-800 rounded-lg p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold">Comic Strip Frames ({currentProject.frames.length})</h3>
                    <button
                      onClick={downloadAllFrames}
                      className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm"
                    >
                      <Download size={16} />
                      Download All
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {currentProject.frames.map(frame => (
                      <div key={frame.id} className="bg-gray-700 rounded-lg p-4">
                        <div className="aspect-video bg-gray-600 rounded-lg overflow-hidden mb-3">
                          <img
                            src={frame.imageUrl}
                            alt={`Frame ${frame.order}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium">Frame {frame.order}</span>
                          <div className="flex gap-2">
                            <button
                              onClick={() => downloadFrame(frame)}
                              className="text-blue-400 hover:text-blue-300 transition-colors"
                              title="Download frame"
                            >
                              <Download size={14} />
                            </button>
                            <button
                              onClick={() => deleteFrame(frame.id)}
                              className="text-red-400 hover:text-red-300 transition-colors"
                              title="Delete frame"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                        <p className="text-sm text-gray-300 overflow-hidden" style={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical'
                        }}>{frame.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* New Project Modal */}
        {showProjectModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
              <h3 className="text-xl font-semibold mb-4">Create New Project</h3>
              <input
                type="text"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="Enter project name..."
                className="w-full bg-gray-700 rounded-lg p-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 mb-4"
              />
              <div className="flex gap-4">
                <button
                  onClick={createNewProject}
                  disabled={!newProjectName.trim()}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed py-2 rounded-lg transition-colors"
                >
                  Create
                </button>
                <button
                  onClick={() => setShowProjectModal(false)}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 py-2 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
        {/* Style Setup Modal */}
        {showStyleSetup && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
              <h3 className="text-xl font-semibold mb-4">Setup Style & Character Consistency</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Art Style Description
                  </label>
                  <textarea
                    placeholder="Describe the art style: Black and white manga style, detailed line work, dramatic shadows..."
                    className="w-full h-24 bg-gray-700 rounded-lg p-3 text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
                    id="styleDescription"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Character Description
                  </label>
                  <textarea
                    placeholder="Describe your main character: A ninja with cat-like features, wearing dark clothing, has pointed ears and whiskers..."
                    className="w-full h-24 bg-gray-700 rounded-lg p-3 text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
                    id="characterDescription"
                  />
                </div>
                <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3">
                  <div className="text-sm text-blue-400 font-medium mb-1">💡 Pro Tip</div>
                  <div className="text-xs text-gray-300">
                    Be as specific as possible. Include details about clothing, facial features, color scheme, 
                    and art style. This information will be used to maintain perfect consistency across all frames.
                  </div>
                </div>
              </div>
              <div className="flex gap-4 mt-6">
                <button
                  onClick={() => {
                    const styleDesc = (document.getElementById('styleDescription') as HTMLTextAreaElement).value;
                    const charDesc = (document.getElementById('characterDescription') as HTMLTextAreaElement).value;
                    if (styleDesc.trim() || charDesc.trim()) {
                      saveCustomStyle(styleDesc, charDesc);
                    }
                  }}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 py-2 rounded-lg transition-colors"
                >
                  Save Style Template
                </button>
                <button
                  onClick={() => setShowStyleSetup(false)}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 py-2 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}