// Buku Pedoman Management
class BukuPedomanManager {
    constructor() {
        this.currentChapter = 1;
        this.currentSection = null;
        this.handbookData = null;
        this.init();
    }

    async init() {
        try {
            await this.loadHandbookData();
            this.renderHandbook();
            this.setupEventListeners();
        } catch (error) {
            console.error('Error initializing Buku Pedoman:', error);
            this.showError('Gagal memuat buku pedoman');
        }
    }

    async loadHandbookData() {
        try {
            // Check if apiService is available
            if (!window.apiService) {
                console.warn('apiService not available, using direct fetch');
                return await this.loadHandbookDataDirect();
            }
            
            const response = await window.apiService.get('/api/buku-pedoman');
            this.handbookData = response;
        } catch (error) {
            console.error('Error loading handbook data:', error);
            // Fallback to direct fetch if apiService fails
            try {
                console.log('Falling back to direct fetch...');
                await this.loadHandbookDataDirect();
            } catch (fallbackError) {
                console.error('Fallback also failed:', fallbackError);
                throw error;
            }
        }
    }

    async loadHandbookDataDirect() {
        try {
            // Get auth token directly from Supabase
            let token = null;
            if (window.supabaseClient) {
                const { data: { session }, error } = await window.supabaseClient.auth.getSession();
                if (!error && session) {
                    token = session.access_token;
                }
            }

            const headers = {
                'Content-Type': 'application/json'
            };

            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch('/api/buku-pedoman', {
                method: 'GET',
                headers: headers
            });

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('Authentication required. Please login first.');
                }
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            this.handbookData = await response.json();
        } catch (error) {
            console.error('Direct fetch failed:', error);
            // Use mock data as last resort
            this.handbookData = this.getMockHandbookData();
        }
    }

    getMockHandbookData() {
        console.log('Using mock handbook data for demonstration');
        return {
            title: "Buku Pedoman Sistem Manajemen Risiko",
            subtitle: "Berdasarkan ISO 31000:2018",
            author: "MUKHSIN HADI, SE, M.Si, CGAA, CPFRM, CSEP, CRP, CPRM, CSCAP, CPAB",
            version: "1.0",
            date: new Date().toISOString().split('T')[0],
            chapters: [
                {
                    id: 1,
                    title: "Pendahuluan",
                    sections: [
                        {
                            id: "1.1",
                            title: "Latar Belakang",
                            content: `Manajemen risiko merupakan bagian integral dari tata kelola organisasi yang baik. 
                            Berdasarkan ISO 31000:2018, manajemen risiko adalah aktivitas terkoordinasi untuk mengarahkan 
                            dan mengendalikan organisasi berkaitan dengan risiko. Buku pedoman ini disusun untuk memberikan 
                            panduan komprehensif dalam implementasi sistem manajemen risiko yang efektif dan efisien.`
                        },
                        {
                            id: "1.2", 
                            title: "Tujuan Buku Pedoman",
                            content: `Buku pedoman ini bertujuan untuk:
                            1. Memberikan pemahaman komprehensif tentang konsep manajemen risiko
                            2. Menyediakan panduan praktis implementasi ISO 31000:2018
                            3. Menjelaskan proses bisnis sistem manajemen risiko
                            4. Memberikan template dan tools yang dapat digunakan langsung
                            5. Memastikan konsistensi penerapan manajemen risiko di seluruh organisasi`
                        }
                    ]
                },
                {
                    id: 2,
                    title: "Kerangka Kerja Manajemen Risiko ISO 31000:2018",
                    sections: [
                        {
                            id: "2.1",
                            title: "Prinsip-Prinsip Manajemen Risiko",
                            content: `Berdasarkan ISO 31000:2018, manajemen risiko harus:
                            1. Terintegrasi - Bagian integral dari semua aktivitas organisasi
                            2. Terstruktur dan komprehensif - Pendekatan terstruktur dan komprehensif
                            3. Disesuaikan - Disesuaikan dengan konteks eksternal dan internal organisasi
                            4. Inklusif - Melibatkan pemangku kepentingan yang tepat
                            5. Dinamis - Responsif terhadap perubahan
                            6. Tersedia informasi terbaik - Berdasarkan informasi historis dan terkini
                            7. Faktor manusia dan budaya - Mempertimbangkan kemampuan, persepsi, dan niat manusia
                            8. Perbaikan berkelanjutan - Terus ditingkatkan melalui pembelajaran dan pengalaman`
                        }
                    ]
                }
            ],
            flowchart: {
                title: "Flowchart Proses Bisnis Sistem Manajemen Risiko",
                description: "Diagram alur proses bisnis manajemen risiko terintegrasi berdasarkan ISO 31000:2018",
                processes: [
                    // Row 1 - Start
                    { id: "start", type: "start", label: "Mulai", x: 400, y: 50 },
                    
                    // Row 2 - Strategic Planning
                    { id: "strategic_planning", type: "process", label: "Perencanaan Strategis", x: 400, y: 120 },
                    
                    // Row 3 - Three parallel processes
                    { id: "visi_misi", type: "process", label: "Visi & Misi", x: 150, y: 200 },
                    { id: "swot_analysis", type: "process", label: "Analisis SWOT", x: 400, y: 200 },
                    { id: "strategic_map", type: "process", label: "Strategic Map", x: 650, y: 200 },
                    
                    // Row 4 - Risk Identification
                    { id: "risk_identification", type: "process", label: "Identifikasi Risiko", x: 400, y: 290 },
                    
                    // Row 5 - Risk Analysis
                    { id: "risk_analysis", type: "process", label: "Analisis Risiko", x: 400, y: 370 },
                    
                    // Row 6 - Risk Evaluation (Decision)
                    { id: "risk_evaluation", type: "decision", label: "Evaluasi", x: 400, y: 450 },
                    
                    // Row 7 - Risk Treatment
                    { id: "risk_treatment", type: "process", label: "Penanganan Risiko", x: 400, y: 540 },
                    
                    // Row 8 - Monitoring
                    { id: "monitoring", type: "process", label: "Monitoring & Review", x: 400, y: 620 },
                    
                    // Row 9 - Reporting
                    { id: "reporting", type: "process", label: "Pelaporan", x: 400, y: 700 },
                    
                    // Row 10 - End
                    { id: "end", type: "end", label: "Selesai", x: 400, y: 780 }
                ],
                connections: [
                    { from: "start", to: "strategic_planning" },
                    { from: "strategic_planning", to: "visi_misi" },
                    { from: "strategic_planning", to: "swot_analysis" },
                    { from: "strategic_planning", to: "strategic_map" },
                    { from: "visi_misi", to: "risk_identification" },
                    { from: "swot_analysis", to: "risk_identification" },
                    { from: "strategic_map", to: "risk_identification" },
                    { from: "risk_identification", to: "risk_analysis" },
                    { from: "risk_analysis", to: "risk_evaluation" },
                    { from: "risk_evaluation", to: "risk_treatment", label: "Ya" },
                    { from: "risk_treatment", to: "monitoring" },
                    { from: "monitoring", to: "reporting" },
                    { from: "reporting", to: "end" }
                ]
            }
        };
    }

    renderHandbook() {
        const container = document.getElementById('buku-pedoman-content');
        if (!container || !this.handbookData) return;

        container.innerHTML = `
            <div class="handbook-container">
                <!-- Header -->
                <div class="handbook-header">
                    <div class="handbook-title-section">
                        <h1 class="handbook-main-title">${this.handbookData.title}</h1>
                        <h2 class="handbook-subtitle">${this.handbookData.subtitle}</h2>
                        <div class="handbook-meta">
                            <div class="author-info">
                                <i class="fas fa-user-tie"></i>
                                <div>
                                    <strong>Penulis & Pengembang:</strong>
                                    <p>${this.handbookData.author}</p>
                                </div>
                            </div>
                            <div class="version-info">
                                <span class="version-badge">Versi ${this.handbookData.version}</span>
                                <span class="date-badge">${new Date(this.handbookData.date).toLocaleDateString('id-ID')}</span>
                            </div>
                        </div>
                    </div>
                    <div class="handbook-actions">
                        <button class="btn btn-primary" onclick="bukuPedomanManager.downloadPDF()">
                            <i class="fas fa-file-pdf"></i> Unduh PDF
                        </button>
                        <button class="btn btn-info" onclick="bukuPedomanManager.printHandbook()">
                            <i class="fas fa-print"></i> Cetak
                        </button>
                        <button class="btn btn-success" onclick="bukuPedomanManager.showFlowchart()">
                            <i class="fas fa-project-diagram"></i> Lihat Flowchart
                        </button>
                    </div>
                </div>

                <!-- Navigation -->
                <div class="handbook-navigation">
                    <div class="nav-sidebar">
                        <h3>Daftar Isi</h3>
                        <ul class="chapter-list">
                            ${this.handbookData.chapters.map(chapter => `
                                <li class="chapter-item ${chapter.id === this.currentChapter ? 'active' : ''}">
                                    <a href="#" onclick="bukuPedomanManager.navigateToChapter(${chapter.id})" class="chapter-link">
                                        <span class="chapter-number">${chapter.id}</span>
                                        <span class="chapter-title">${chapter.title}</span>
                                    </a>
                                    <ul class="section-list">
                                        ${chapter.sections.map(section => `
                                            <li class="section-item">
                                                <a href="#" onclick="bukuPedomanManager.navigateToSection('${section.id}')" class="section-link">
                                                    ${section.id} ${section.title}
                                                </a>
                                            </li>
                                        `).join('')}
                                    </ul>
                                </li>
                            `).join('')}
                        </ul>
                    </div>

                    <!-- Content Area -->
                    <div class="handbook-content">
                        <div id="chapter-content">
                            ${this.renderChapterContent(this.currentChapter)}
                        </div>
                        
                        <!-- Navigation Controls -->
                        <div class="content-navigation">
                            <button class="btn btn-secondary" onclick="bukuPedomanManager.previousChapter()" 
                                    ${this.currentChapter <= 1 ? 'disabled' : ''}>
                                <i class="fas fa-chevron-left"></i> Sebelumnya
                            </button>
                            <span class="chapter-indicator">
                                Bab ${this.currentChapter} dari ${this.handbookData.chapters.length}
                            </span>
                            <button class="btn btn-secondary" onclick="bukuPedomanManager.nextChapter()"
                                    ${this.currentChapter >= this.handbookData.chapters.length ? 'disabled' : ''}>
                                Selanjutnya <i class="fas fa-chevron-right"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Flowchart Modal -->
            <div id="flowchart-modal" class="modal" style="display: none;">
                <div class="modal-content flowchart-modal-content">
                    <div class="modal-header">
                        <h3>${this.handbookData.flowchart.title}</h3>
                        <button class="modal-close" onclick="bukuPedomanManager.closeFlowchart()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <p class="flowchart-description">${this.handbookData.flowchart.description}</p>
                        <div id="flowchart-container" class="flowchart-container">
                            ${this.renderFlowchart()}
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-primary" onclick="bukuPedomanManager.downloadFlowchartPDF()">
                            <i class="fas fa-download"></i> Unduh Flowchart
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    renderChapterContent(chapterId) {
        const chapter = this.handbookData.chapters.find(c => c.id === chapterId);
        if (!chapter) return '<p>Bab tidak ditemukan</p>';

        return `
            <div class="chapter-content">
                <div class="chapter-header">
                    <h2 class="chapter-title">
                        <span class="chapter-number">Bab ${chapter.id}</span>
                        ${chapter.title}
                    </h2>
                </div>
                
                <div class="sections-container">
                    ${chapter.sections.map(section => `
                        <div class="section" id="section-${section.id}">
                            <h3 class="section-title">
                                <span class="section-number">${section.id}</span>
                                ${section.title}
                            </h3>
                            <div class="section-content">
                                ${this.formatContent(section.content)}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    formatContent(content) {
        // Convert plain text to formatted HTML
        return content
            .replace(/\n\n/g, '</p><p>')
            .replace(/\n/g, '<br>')
            .replace(/^/, '<p>')
            .replace(/$/, '</p>')
            .replace(/(\d+\.\s)/g, '<strong>$1</strong>')
            .replace(/([A-Z\s]+:)/g, '<strong>$1</strong>')
            .replace(/- /g, '• ');
    }

    renderFlowchart() {
        // Use enhanced flowchart module if available
        if (window.EnhancedFlowchartModule) {
            console.log('Using EnhancedFlowchartModule for flowchart rendering');
            // Return a placeholder that will be filled by the enhanced module
            setTimeout(() => {
                const container = document.getElementById('flowchart-container');
                if (container) {
                    window.EnhancedFlowchartModule.render('flowchart-container');
                }
            }, 100);
            return '<div id="flowchart-loading" style="text-align:center;padding:50px;"><i class="fas fa-spinner fa-spin" style="font-size:2rem;color:#3498db;"></i><p style="margin-top:1rem;color:#666;">Memuat flowchart...</p></div>';
        }
        
        // Fallback to original flowchart
        const flowchart = this.handbookData.flowchart;
        
        return `
            <div class="flowchart-svg-container" style="overflow: auto; max-height: 800px; width: 100%;">
                <svg width="1000" height="1100" viewBox="0 0 1000 1100" class="flowchart-svg" style="background: white; border-radius: 8px; display: block; margin: 0 auto;">
                    <!-- Background -->
                    <defs>
                        <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#f0f0f0" stroke-width="0.5"/>
                        </pattern>
                        
                        <!-- Gradients for different process types -->
                        <linearGradient id="startGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" style="stop-color:#4CAF50;stop-opacity:1" />
                            <stop offset="100%" style="stop-color:#45a049;stop-opacity:1" />
                        </linearGradient>
                        
                        <linearGradient id="processGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" style="stop-color:#2196F3;stop-opacity:1" />
                            <stop offset="100%" style="stop-color:#1976D2;stop-opacity:1" />
                        </linearGradient>
                        
                        <linearGradient id="decisionGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" style="stop-color:#FF9800;stop-opacity:1" />
                            <stop offset="100%" style="stop-color:#F57C00;stop-opacity:1" />
                        </linearGradient>
                        
                        <linearGradient id="endGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" style="stop-color:#F44336;stop-opacity:1" />
                            <stop offset="100%" style="stop-color:#D32F2F;stop-opacity:1" />
                        </linearGradient>
                        
                        <!-- Arrow marker -->
                        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                            <polygon points="0 0, 10 3.5, 0 7" fill="#666"/>
                        </marker>
                    </defs>
                    
                    <rect width="100%" height="100%" fill="url(#grid)" />
                    
                    <!-- Title -->
                    <text x="400" y="20" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="#333" font-weight="bold">
                        Proses Manajemen Risiko ISO 31000:2018
                    </text>
                    
                    <!-- Connections (draw first so they appear behind nodes) -->
                    ${flowchart.connections.map(conn => this.renderFlowchartConnection(conn, flowchart.processes)).join('')}
                    
                    <!-- Process Nodes -->
                    ${flowchart.processes.map(process => this.renderFlowchartNode(process)).join('')}
                </svg>
            </div>
            
            <!-- Legend -->
            <div class="flowchart-legend" style="margin-top: 20px; padding: 15px; background: white; border-radius: 8px; border: 1px solid #e0e0e0;">
                <h4 style="margin: 0 0 15px 0; color: #333; font-size: 14px;">📋 Keterangan:</h4>
                <div class="legend-items" style="display: flex; flex-wrap: wrap; gap: 20px; justify-content: center;">
                    <div class="legend-item" style="display: flex; align-items: center; gap: 8px;">
                        <div style="width: 30px; height: 20px; background: linear-gradient(135deg, #4CAF50, #45a049); border-radius: 10px;"></div>
                        <span style="font-size: 12px; color: #666;">Mulai/Selesai</span>
                    </div>
                    <div class="legend-item" style="display: flex; align-items: center; gap: 8px;">
                        <div style="width: 30px; height: 20px; background: linear-gradient(135deg, #2196F3, #1976D2); border-radius: 4px;"></div>
                        <span style="font-size: 12px; color: #666;">Proses</span>
                    </div>
                    <div class="legend-item" style="display: flex; align-items: center; gap: 8px;">
                        <div style="width: 20px; height: 20px; background: linear-gradient(135deg, #FF9800, #F57C00); transform: rotate(45deg);"></div>
                        <span style="font-size: 12px; color: #666; margin-left: 5px;">Keputusan</span>
                    </div>
                    <div class="legend-item" style="display: flex; align-items: center; gap: 8px;">
                        <div style="width: 30px; height: 2px; background: #666; position: relative;">
                            <div style="position: absolute; right: -2px; top: -4px; width: 0; height: 0; border-left: 8px solid #666; border-top: 5px solid transparent; border-bottom: 5px solid transparent;"></div>
                        </div>
                        <span style="font-size: 12px; color: #666;">Alur Proses</span>
                    </div>
                </div>
            </div>
        `;
    }

    renderFlowchartNode(process) {
        const x = process.x;
        const y = process.y;
        
        let shape = '';
        
        switch (process.type) {
            case 'start':
                shape = `<ellipse cx="${x}" cy="${y}" rx="40" ry="20" fill="url(#startGradient)" stroke="#388E3C" stroke-width="2"/>`;
                break;
            case 'end':
                shape = `<ellipse cx="${x}" cy="${y}" rx="40" ry="20" fill="url(#endGradient)" stroke="#C62828" stroke-width="2"/>`;
                break;
            case 'process':
                shape = `<rect x="${x-60}" y="${y-18}" width="120" height="36" rx="4" fill="url(#processGradient)" stroke="#1565C0" stroke-width="2"/>`;
                break;
            case 'decision':
                shape = `<polygon points="${x},${y-22} ${x+35},${y} ${x},${y+22} ${x-35},${y}" fill="url(#decisionGradient)" stroke="#EF6C00" stroke-width="2"/>`;
                break;
        }
        
        // Text - handle single line labels
        const label = process.label;
        const textY = process.type === 'decision' ? y + 4 : y + 5;
        const fontSize = process.type === 'decision' ? '9' : '10';
        
        return `
            <g class="flowchart-node" data-id="${process.id}" style="cursor: pointer;">
                ${shape}
                <text x="${x}" y="${textY}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${fontSize}" fill="white" font-weight="bold">${label}</text>
            </g>
        `;
    }

    renderFlowchartConnection(connection, processes) {
        const fromProcess = processes.find(p => p.id === connection.from);
        const toProcess = processes.find(p => p.id === connection.to);
        
        if (!fromProcess || !toProcess) return '';
        
        let x1 = fromProcess.x;
        let y1 = fromProcess.y;
        let x2 = toProcess.x;
        let y2 = toProcess.y;
        
        // Adjust start and end points based on node type and direction
        const nodeHeight = fromProcess.type === 'start' || fromProcess.type === 'end' ? 20 : 18;
        const nodeWidth = 60;
        
        // Determine if connection is vertical, horizontal, or diagonal
        const dx = x2 - x1;
        const dy = y2 - y1;
        
        // Adjust y1 (from bottom of source node)
        if (Math.abs(dy) > Math.abs(dx)) {
            // Mostly vertical
            if (dy > 0) {
                y1 += nodeHeight; // Start from bottom
                y2 -= (toProcess.type === 'decision' ? 22 : nodeHeight); // End at top
            } else {
                y1 -= nodeHeight;
                y2 += (toProcess.type === 'decision' ? 22 : nodeHeight);
            }
        } else {
            // Mostly horizontal
            if (dx > 0) {
                x1 += nodeWidth;
                x2 -= nodeWidth;
            } else {
                x1 -= nodeWidth;
                x2 += nodeWidth;
            }
        }
        
        // Create path - use curved lines for better appearance
        let path;
        if (Math.abs(dx) < 10) {
            // Straight vertical line
            path = `M ${x1} ${y1} L ${x2} ${y2}`;
        } else if (Math.abs(dy) < 10) {
            // Straight horizontal line
            path = `M ${x1} ${y1} L ${x2} ${y2}`;
        } else {
            // Curved line for diagonal connections
            const midY = (y1 + y2) / 2;
            path = `M ${x1} ${y1} L ${x1} ${midY} L ${x2} ${midY} L ${x2} ${y2}`;
        }
        
        // Label position
        const labelX = (x1 + x2) / 2;
        const labelY = (y1 + y2) / 2 - 8;
        
        return `
            <g class="flowchart-connection">
                <path d="${path}" stroke="#666" stroke-width="2" fill="none" marker-end="url(#arrowhead)"/>
                ${connection.label ? `<text x="${labelX}" y="${labelY}" text-anchor="middle" font-family="Arial, sans-serif" font-size="9" fill="#333" font-weight="bold" style="background: white;">${connection.label}</text>` : ''}
            </g>
        `;
    }

    navigateToChapter(chapterId) {
        this.currentChapter = chapterId;
        this.updateChapterContent();
        this.updateNavigation();
    }

    navigateToSection(sectionId) {
        this.currentSection = sectionId;
        const sectionElement = document.getElementById(`section-${sectionId}`);
        if (sectionElement) {
            sectionElement.scrollIntoView({ behavior: 'smooth' });
            // Highlight section temporarily
            sectionElement.classList.add('highlighted');
            setTimeout(() => sectionElement.classList.remove('highlighted'), 2000);
        }
    }

    previousChapter() {
        if (this.currentChapter > 1) {
            this.navigateToChapter(this.currentChapter - 1);
        }
    }

    nextChapter() {
        if (this.currentChapter < this.handbookData.chapters.length) {
            this.navigateToChapter(this.currentChapter + 1);
        }
    }

    updateChapterContent() {
        const contentContainer = document.getElementById('chapter-content');
        if (contentContainer) {
            contentContainer.innerHTML = this.renderChapterContent(this.currentChapter);
        }
    }

    updateNavigation() {
        // Update active chapter in navigation
        document.querySelectorAll('.chapter-item').forEach(item => {
            item.classList.remove('active');
        });
        
        const activeChapter = document.querySelector(`.chapter-item:nth-child(${this.currentChapter})`);
        if (activeChapter) {
            activeChapter.classList.add('active');
        }
        
        // Update navigation buttons
        const prevBtn = document.querySelector('.content-navigation .btn:first-child');
        const nextBtn = document.querySelector('.content-navigation .btn:last-child');
        const indicator = document.querySelector('.chapter-indicator');
        
        if (prevBtn) prevBtn.disabled = this.currentChapter <= 1;
        if (nextBtn) nextBtn.disabled = this.currentChapter >= this.handbookData.chapters.length;
        if (indicator) indicator.textContent = `Bab ${this.currentChapter} dari ${this.handbookData.chapters.length}`;
    }

    showFlowchart() {
        console.log('showFlowchart() called');
        
        let modal = document.getElementById('flowchart-modal');
        
        // If modal doesn't exist, create it first
        if (!modal) {
            console.log('Modal not found, creating dynamically...');
            this.createFlowchartModal();
            modal = document.getElementById('flowchart-modal');
        }
        
        if (modal) {
            console.log('Displaying flowchart modal...');
            
            // Apply comprehensive inline styles to ensure modal displays correctly
            modal.style.cssText = `
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                right: 0 !important;
                bottom: 0 !important;
                width: 100vw !important;
                height: 100vh !important;
                background-color: rgba(0, 0, 0, 0.8) !important;
                z-index: 99999 !important;
                padding: 20px !important;
                box-sizing: border-box !important;
            `;
            document.body.style.overflow = 'hidden';
            
            // Ensure modal content is visible with comprehensive styling
            const modalContent = modal.querySelector('.flowchart-modal-content, .modal-content');
            if (modalContent) {
                modalContent.style.cssText = `
                    display: flex !important;
                    flex-direction: column !important;
                    width: 90vw !important;
                    max-width: 1200px !important;
                    max-height: 90vh !important;
                    overflow: hidden !important;
                    background-color: white !important;
                    border-radius: 16px !important;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.4) !important;
                    animation: modalSlideIn 0.3s ease-out !important;
                `;
            }
            
            // Style modal header
            const modalHeader = modal.querySelector('.modal-header');
            if (modalHeader) {
                modalHeader.style.cssText = `
                    display: flex !important;
                    justify-content: space-between !important;
                    align-items: center !important;
                    padding: 20px 30px !important;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
                    color: white !important;
                    border-radius: 16px 16px 0 0 !important;
                `;
            }
            
            // Style modal body
            const modalBody = modal.querySelector('.modal-body');
            if (modalBody) {
                modalBody.style.cssText = `
                    flex: 1 !important;
                    padding: 30px !important;
                    overflow-y: auto !important;
                    background: #f8f9fa !important;
                `;
            }
            
            // Style modal footer
            const modalFooter = modal.querySelector('.modal-footer');
            if (modalFooter) {
                modalFooter.style.cssText = `
                    padding: 20px 30px !important;
                    background: white !important;
                    border-top: 1px solid #e9ecef !important;
                    display: flex !important;
                    justify-content: flex-end !important;
                    gap: 10px !important;
                    border-radius: 0 0 16px 16px !important;
                `;
            }
            
            // Style close button
            const closeBtn = modal.querySelector('.modal-close');
            if (closeBtn) {
                closeBtn.style.cssText = `
                    background: rgba(255, 255, 255, 0.2) !important;
                    border: none !important;
                    color: white !important;
                    font-size: 1.5rem !important;
                    cursor: pointer !important;
                    padding: 8px 12px !important;
                    border-radius: 8px !important;
                    transition: all 0.3s ease !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                `;
            }
            
            // Style flowchart container
            const flowchartContainer = modal.querySelector('.flowchart-container, #flowchart-container');
            if (flowchartContainer) {
                flowchartContainer.style.cssText = `
                    background: white !important;
                    border-radius: 12px !important;
                    padding: 30px !important;
                    border: 1px solid #e9ecef !important;
                    margin-bottom: 20px !important;
                    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05) !important;
                    min-height: 400px !important;
                `;
            }
            
            console.log('Flowchart modal opened successfully');
        }
    }
    
    createFlowchartModal() {
        console.log('Creating flowchart modal dynamically...');
        
        // Create modal dynamically if it doesn't exist
        const existingModal = document.getElementById('flowchart-modal');
        if (existingModal) {
            existingModal.remove();
        }
        
        const modal = document.createElement('div');
        modal.id = 'flowchart-modal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content flowchart-modal-content" style="
                display: flex;
                flex-direction: column;
                width: 90vw;
                max-width: 1200px;
                max-height: 90vh;
                overflow: hidden;
                background-color: white;
                border-radius: 16px;
                box-shadow: 0 20px 60px rgba(0,0,0,0.4);
            ">
                <div class="modal-header" style="
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 20px 30px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border-radius: 16px 16px 0 0;
                ">
                    <h3 style="margin: 0; font-size: 1.5rem;">${this.handbookData?.flowchart?.title || 'Flowchart Proses Bisnis'}</h3>
                    <button class="modal-close" onclick="bukuPedomanManager.closeFlowchart()" style="
                        background: rgba(255, 255, 255, 0.2);
                        border: none;
                        color: white;
                        font-size: 1.5rem;
                        cursor: pointer;
                        padding: 8px 12px;
                        border-radius: 8px;
                    ">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body" style="
                    flex: 1;
                    padding: 30px;
                    overflow-y: auto;
                    background: #f8f9fa;
                ">
                    <p class="flowchart-description" style="
                        margin-bottom: 20px;
                        color: #495057;
                        font-size: 1rem;
                        line-height: 1.6;
                        text-align: center;
                        padding: 15px;
                        background: white;
                        border-radius: 8px;
                        border-left: 4px solid #667eea;
                    ">${this.handbookData?.flowchart?.description || 'Diagram alur proses bisnis manajemen risiko'}</p>
                    <div id="flowchart-container" class="flowchart-container" style="
                        background: white;
                        border-radius: 12px;
                        padding: 30px;
                        border: 1px solid #e9ecef;
                        margin-bottom: 20px;
                        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
                        min-height: 400px;
                    ">
                        ${this.renderFlowchart()}
                    </div>
                </div>
                <div class="modal-footer" style="
                    padding: 20px 30px;
                    background: white;
                    border-top: 1px solid #e9ecef;
                    display: flex;
                    justify-content: flex-end;
                    gap: 10px;
                    border-radius: 0 0 16px 16px;
                ">
                    <button class="btn btn-secondary" onclick="bukuPedomanManager.closeFlowchart()" style="
                        padding: 12px 24px;
                        border-radius: 8px;
                        font-weight: 500;
                        background: #6c757d;
                        color: white;
                        border: none;
                        cursor: pointer;
                    ">
                        <i class="fas fa-times"></i> Tutup
                    </button>
                    <button class="btn btn-primary" onclick="bukuPedomanManager.downloadFlowchartPDF()" style="
                        padding: 12px 24px;
                        border-radius: 8px;
                        font-weight: 500;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        border: none;
                        cursor: pointer;
                    ">
                        <i class="fas fa-download"></i> Unduh Flowchart
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        console.log('Flowchart modal created and appended to body');
        
        // Don't call showFlowchart() here to avoid recursion
        // The modal will be shown by the caller
    }

    closeFlowchart() {
        const modal = document.getElementById('flowchart-modal');
        if (modal) {
            // Hide modal with animation
            modal.style.opacity = '0';
            modal.style.transition = 'opacity 0.2s ease-out';
            
            setTimeout(() => {
                modal.style.display = 'none';
                modal.style.opacity = '';
                modal.style.transition = '';
            }, 200);
            
            document.body.style.overflow = 'auto';
            console.log('Flowchart modal closed');
        }
    }

    async downloadPDF() {
        try {
            this.showLoading('Generating PDF...');
            
            // Try to generate PDF client-side first (more reliable)
            await this.generateClientSidePDF();
            
        } catch (error) {
            console.error('Error downloading PDF:', error);
            this.showError('Gagal mengunduh PDF: ' + error.message);
        } finally {
            this.hideLoading();
        }
    }

    async downloadPDFDirect() {
        try {
            // Get auth token directly
            let token = null;
            if (window.supabaseClient) {
                const { data: { session }, error } = await window.supabaseClient.auth.getSession();
                if (!error && session) {
                    token = session.access_token;
                }
            }

            const headers = {
                'Content-Type': 'application/json'
            };

            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch('/api/buku-pedoman/pdf', {
                method: 'GET',
                headers: headers
            });

            if (response.ok) {
                return await response.json();
            } else {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
        } catch (error) {
            console.error('Direct PDF download failed:', error);
            throw error;
        }
    }

    async generateClientSidePDF() {
        try {
            this.showLoading('Generating PDF...');
            
            // Load jsPDF if not available
            if (typeof window.jspdf === 'undefined' && typeof window.jsPDF === 'undefined') {
                await this.loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
            }

            const jsPDF = window.jspdf?.jsPDF || window.jsPDF;
            if (!jsPDF) {
                throw new Error('jsPDF library not available');
            }

            const pdf = new jsPDF('p', 'mm', 'a4');
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const margin = 20;
            const contentWidth = pageWidth - (margin * 2);
            
            // Title page
            pdf.setFontSize(24);
            pdf.setTextColor(44, 62, 80);
            pdf.text(this.handbookData.title, pageWidth / 2, 50, { align: 'center' });
            
            pdf.setFontSize(16);
            pdf.setTextColor(52, 73, 94);
            pdf.text(this.handbookData.subtitle, pageWidth / 2, 65, { align: 'center' });
            
            pdf.setFontSize(11);
            pdf.setTextColor(100, 100, 100);
            pdf.text('Penulis & Pengembang:', pageWidth / 2, 90, { align: 'center' });
            
            pdf.setFontSize(10);
            pdf.text(this.handbookData.author, pageWidth / 2, 100, { align: 'center' });
            
            pdf.setFontSize(10);
            pdf.text(`Versi ${this.handbookData.version}`, pageWidth / 2, 120, { align: 'center' });
            pdf.text(`Tanggal: ${new Date(this.handbookData.date).toLocaleDateString('id-ID')}`, pageWidth / 2, 128, { align: 'center' });
            
            // Add content from handbook data
            if (this.handbookData && this.handbookData.chapters) {
                this.handbookData.chapters.forEach((chapter, chapterIndex) => {
                    // New page for each chapter
                    pdf.addPage();
                    let yPosition = margin;
                    
                    // Chapter title
                    pdf.setFontSize(16);
                    pdf.setTextColor(44, 62, 80);
                    pdf.text(`Bab ${chapter.id}: ${chapter.title}`, margin, yPosition);
                    yPosition += 15;
                    
                    // Draw line under chapter title
                    pdf.setDrawColor(52, 152, 219);
                    pdf.setLineWidth(0.5);
                    pdf.line(margin, yPosition - 5, pageWidth - margin, yPosition - 5);
                    yPosition += 5;
                    
                    // Add sections
                    if (chapter.sections) {
                        chapter.sections.forEach(section => {
                            // Check if we need a new page
                            if (yPosition > pageHeight - 40) {
                                pdf.addPage();
                                yPosition = margin;
                            }
                            
                            // Section title
                            pdf.setFontSize(12);
                            pdf.setTextColor(52, 73, 94);
                            pdf.text(`${section.id} ${section.title}`, margin, yPosition);
                            yPosition += 8;
                            
                            // Section content
                            pdf.setFontSize(10);
                            pdf.setTextColor(60, 60, 60);
                            
                            // Split content into lines that fit the page width
                            const lines = pdf.splitTextToSize(section.content, contentWidth);
                            
                            lines.forEach(line => {
                                if (yPosition > pageHeight - 20) {
                                    pdf.addPage();
                                    yPosition = margin;
                                }
                                pdf.text(line, margin, yPosition);
                                yPosition += 5;
                            });
                            
                            yPosition += 8; // Space between sections
                        });
                    }
                });
            }
            
            // Add page numbers
            const totalPages = pdf.internal.getNumberOfPages();
            for (let i = 1; i <= totalPages; i++) {
                pdf.setPage(i);
                pdf.setFontSize(9);
                pdf.setTextColor(128, 128, 128);
                pdf.text(`Halaman ${i} dari ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
            }
            
            // Save the PDF
            const fileName = `Buku_Pedoman_Manajemen_Risiko_${new Date().toISOString().split('T')[0]}.pdf`;
            pdf.save(fileName);
            this.showSuccess(`PDF berhasil diunduh: ${fileName}`);
            
        } catch (error) {
            console.error('Client-side PDF generation failed:', error);
            throw error;
        }
    }

    async loadScript(src) {
        return new Promise((resolve, reject) => {
            const existing = document.querySelector(`script[src="${src}"]`);
            if (existing) {
                resolve();
                return;
            }
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    printHandbook() {
        try {
            // Check if handbook data is available
            if (!this.handbookData) {
                this.showError('Data buku pedoman belum dimuat. Silakan tunggu atau refresh halaman.');
                return;
            }
            
            // Generate print content
            const printContent = this.generatePrintContent();
            
            // Create a new window for printing
            const printWindow = window.open('', '_blank', 'width=900,height=700,scrollbars=yes,resizable=yes');
            
            if (!printWindow) {
                // Popup blocked - try alternative method
                console.warn('Popup blocked, trying alternative print method');
                this.printAlternative(printContent);
                return;
            }
            
            const printDocument = `
                <!DOCTYPE html>
                <html lang="id">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>${this.handbookData.title}</title>
                    <style>
                        * { 
                            box-sizing: border-box; 
                            margin: 0;
                            padding: 0;
                        }
                        body { 
                            font-family: 'Times New Roman', Times, serif; 
                            margin: 0;
                            padding: 25px;
                            line-height: 1.7;
                            color: #333;
                            background: white;
                            font-size: 12pt;
                        }
                        .print-header { 
                            text-align: center; 
                            margin-bottom: 40px; 
                            border-bottom: 3px solid #2c3e50; 
                            padding-bottom: 30px; 
                        }
                        .print-header h1 {
                            font-size: 22pt;
                            color: #2c3e50;
                            margin-bottom: 10px;
                            font-weight: bold;
                        }
                        .print-header h2 {
                            font-size: 14pt;
                            color: #34495e;
                            font-weight: normal;
                            margin-bottom: 20px;
                        }
                        .print-header .author {
                            font-size: 10pt;
                            color: #666;
                            margin-bottom: 10px;
                        }
                        .print-header .meta {
                            font-size: 9pt;
                            color: #888;
                            margin-top: 10px;
                        }
                        .toc {
                            margin-bottom: 40px;
                            page-break-after: always;
                        }
                        .toc h3 {
                            color: #2c3e50;
                            border-bottom: 2px solid #3498db;
                            padding-bottom: 10px;
                            margin-bottom: 20px;
                            font-size: 14pt;
                        }
                        .toc ul {
                            list-style: none;
                            padding-left: 0;
                        }
                        .toc > ul > li {
                            margin: 12px 0;
                        }
                        .toc ul ul {
                            padding-left: 25px;
                            margin-top: 8px;
                        }
                        .toc ul ul li {
                            margin: 5px 0;
                            color: #555;
                            font-size: 10pt;
                        }
                        .chapter { 
                            page-break-before: always; 
                            margin-bottom: 30px; 
                        }
                        .chapter:first-of-type { 
                            page-break-before: auto; 
                        }
                        .chapter-title { 
                            color: #2c3e50; 
                            border-bottom: 2px solid #3498db; 
                            padding-bottom: 12px;
                            font-size: 16pt;
                            margin-bottom: 25px;
                            font-weight: bold;
                        }
                        .section { 
                            margin: 25px 0; 
                            page-break-inside: avoid;
                        }
                        .section-title { 
                            color: #34495e; 
                            margin: 20px 0 15px 0;
                            font-size: 13pt;
                            border-left: 4px solid #3498db;
                            padding-left: 12px;
                            font-weight: bold;
                        }
                        .section-content { 
                            margin-left: 16px;
                            text-align: justify;
                            font-size: 11pt;
                        }
                        .section-content p {
                            margin-bottom: 12px;
                            text-indent: 20px;
                        }
                        .section-content p:first-child {
                            text-indent: 0;
                        }
                        .footer {
                            margin-top: 50px;
                            padding-top: 20px;
                            border-top: 2px solid #ddd;
                            text-align: center;
                            color: #888;
                            font-size: 9pt;
                        }
                        .print-btn {
                            position: fixed;
                            top: 10px;
                            right: 10px;
                            padding: 12px 24px;
                            background: #3498db;
                            color: white;
                            border: none;
                            border-radius: 6px;
                            cursor: pointer;
                            font-size: 14px;
                            font-weight: bold;
                            z-index: 1000;
                            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
                        }
                        .print-btn:hover {
                            background: #2980b9;
                        }
                        @media print {
                            body { 
                                margin: 0; 
                                padding: 15mm;
                                font-size: 11pt;
                            }
                            .chapter { 
                                page-break-before: always; 
                            }
                            .chapter:first-of-type { 
                                page-break-before: auto; 
                            }
                            .section {
                                page-break-inside: avoid;
                            }
                            .print-btn {
                                display: none !important;
                            }
                        }
                        @page {
                            margin: 15mm;
                            size: A4;
                        }
                    </style>
                </head>
                <body>
                    <button class="print-btn" onclick="window.print()">🖨️ Cetak Sekarang</button>
                    ${printContent}
                </body>
                </html>
            `;
            
            printWindow.document.write(printDocument);
            printWindow.document.close();
            
            // Focus the window and trigger print after content loads
            printWindow.focus();
            
            // Wait for content to load before printing
            printWindow.onload = function() {
                setTimeout(function() {
                    printWindow.print();
                }, 300);
            };
            
            this.showSuccess('Jendela cetak dibuka. Klik tombol "Cetak Sekarang" atau gunakan Ctrl+P.');
            
        } catch (error) {
            console.error('Print error:', error);
            this.showError('Gagal mencetak: ' + error.message);
        }
    }
    
    printAlternative(printContent) {
        // Alternative print method using iframe
        try {
            // Remove existing print iframe
            const existingFrame = document.getElementById('print-frame');
            if (existingFrame) {
                existingFrame.remove();
            }
            
            // Create hidden iframe
            const iframe = document.createElement('iframe');
            iframe.id = 'print-frame';
            iframe.style.cssText = 'position: fixed; right: 0; bottom: 0; width: 0; height: 0; border: 0;';
            document.body.appendChild(iframe);
            
            const iframeDoc = iframe.contentWindow.document;
            iframeDoc.open();
            iframeDoc.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>${this.handbookData.title}</title>
                    <style>
                        * { box-sizing: border-box; }
                        body { 
                            font-family: 'Times New Roman', Times, serif; 
                            padding: 20px;
                            line-height: 1.6;
                            color: #333;
                        }
                        .print-header { 
                            text-align: center; 
                            margin-bottom: 30px; 
                            border-bottom: 2px solid #2c3e50; 
                            padding-bottom: 20px; 
                        }
                        .print-header h1 { font-size: 20pt; color: #2c3e50; margin-bottom: 8px; }
                        .print-header h2 { font-size: 12pt; color: #34495e; font-weight: normal; }
                        .chapter { page-break-before: always; margin-bottom: 20px; }
                        .chapter:first-of-type { page-break-before: auto; }
                        .chapter-title { color: #2c3e50; border-bottom: 1px solid #3498db; padding-bottom: 8px; font-size: 14pt; margin-bottom: 15px; }
                        .section { margin: 15px 0; }
                        .section-title { color: #34495e; font-size: 12pt; margin: 15px 0 10px 0; border-left: 3px solid #3498db; padding-left: 10px; }
                        .section-content { margin-left: 13px; text-align: justify; font-size: 10pt; }
                        @page { margin: 15mm; }
                    </style>
                </head>
                <body>${printContent}</body>
                </html>
            `);
            iframeDoc.close();
            
            // Wait for iframe to load then print
            setTimeout(() => {
                iframe.contentWindow.focus();
                iframe.contentWindow.print();
                
                // Remove iframe after printing
                setTimeout(() => {
                    iframe.remove();
                }, 1000);
            }, 500);
            
            this.showSuccess('Memproses cetak...');
            
        } catch (error) {
            console.error('Alternative print failed:', error);
            this.showError('Gagal mencetak. Silakan coba lagi atau izinkan popup di browser Anda.');
        }
    }

    generatePrintContent() {
        return `
            <div class="print-header">
                <h1>${this.handbookData.title}</h1>
                <h2>${this.handbookData.subtitle}</h2>
                <div class="author">
                    <strong>Penulis & Pengembang:</strong><br>
                    ${this.handbookData.author}
                </div>
                <div class="meta">
                    <strong>Versi:</strong> ${this.handbookData.version} | 
                    <strong>Tanggal:</strong> ${new Date(this.handbookData.date).toLocaleDateString('id-ID', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    })}
                </div>
            </div>
            
            <div class="toc" style="margin-bottom: 30px;">
                <h3 style="color: #2c3e50; border-bottom: 1px solid #ddd; padding-bottom: 10px;">Daftar Isi</h3>
                <ul style="list-style: none; padding-left: 0;">
                    ${this.handbookData.chapters.map(chapter => `
                        <li style="margin: 8px 0;">
                            <strong>Bab ${chapter.id}:</strong> ${chapter.title}
                            <ul style="list-style: none; padding-left: 20px; margin-top: 5px;">
                                ${chapter.sections.map(section => `
                                    <li style="margin: 3px 0; color: #666;">${section.id} ${section.title}</li>
                                `).join('')}
                            </ul>
                        </li>
                    `).join('')}
                </ul>
            </div>
            
            ${this.handbookData.chapters.map(chapter => `
                <div class="chapter">
                    <h2 class="chapter-title">Bab ${chapter.id}: ${chapter.title}</h2>
                    ${chapter.sections.map(section => `
                        <div class="section">
                            <h3 class="section-title">${section.id} ${section.title}</h3>
                            <div class="section-content">
                                ${this.formatContent(section.content)}
                            </div>
                        </div>
                    `).join('')}
                </div>
            `).join('')}
            
            <div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #ddd; text-align: center; color: #888; font-size: 11px;">
                <p>Dokumen ini dicetak dari Sistem Manajemen Risiko PINTAR MR</p>
                <p>© ${new Date().getFullYear()} - Hak Cipta Dilindungi Undang-Undang</p>
            </div>
        `;
    }

    async downloadFlowchartPDF() {
        try {
            this.showLoading('Generating flowchart PDF...');
            
            // Load required libraries
            if (typeof window.jspdf === 'undefined' && typeof window.jsPDF === 'undefined') {
                await this.loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
            }
            
            // Try to use html2canvas if available, otherwise create simple PDF
            let useHtml2Canvas = false;
            if (typeof html2canvas === 'undefined') {
                try {
                    await this.loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
                    useHtml2Canvas = true;
                } catch (e) {
                    console.warn('html2canvas not available, using simple PDF');
                }
            } else {
                useHtml2Canvas = true;
            }
            
            const jsPDF = window.jspdf?.jsPDF || window.jsPDF;
            if (!jsPDF) {
                throw new Error('jsPDF library not available');
            }
            
            const pdf = new jsPDF('l', 'mm', 'a4'); // Landscape orientation
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            
            if (useHtml2Canvas) {
                // Use html2canvas to capture the flowchart
                const flowchartContainer = document.getElementById('flowchart-container');
                if (flowchartContainer) {
                    const canvas = await html2canvas(flowchartContainer, {
                        scale: 2,
                        backgroundColor: '#ffffff',
                        logging: false
                    });
                    
                    const imgWidth = pageWidth - 20;
                    const imgHeight = (canvas.height * imgWidth) / canvas.width;
                    
                    // Add title
                    pdf.setFontSize(16);
                    pdf.setTextColor(44, 62, 80);
                    pdf.text(this.handbookData.flowchart.title, pageWidth / 2, 15, { align: 'center' });
                    
                    // Add image
                    const yOffset = 25;
                    if (imgHeight > pageHeight - yOffset - 20) {
                        // Scale down if too tall
                        const scaledHeight = pageHeight - yOffset - 20;
                        const scaledWidth = (canvas.width * scaledHeight) / canvas.height;
                        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', (pageWidth - scaledWidth) / 2, yOffset, scaledWidth, scaledHeight);
                    } else {
                        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 10, yOffset, imgWidth, imgHeight);
                    }
                }
            } else {
                // Create simple text-based flowchart PDF
                pdf.setFontSize(18);
                pdf.setTextColor(44, 62, 80);
                pdf.text(this.handbookData.flowchart.title, pageWidth / 2, 20, { align: 'center' });
                
                pdf.setFontSize(12);
                pdf.setTextColor(100, 100, 100);
                pdf.text(this.handbookData.flowchart.description, pageWidth / 2, 30, { align: 'center' });
                
                // Draw process boxes
                let y = 50;
                const boxWidth = 80;
                const boxHeight = 25;
                const centerX = pageWidth / 2;
                
                this.handbookData.flowchart.processes.forEach((process, index) => {
                    if (y > pageHeight - 40) {
                        pdf.addPage();
                        y = 30;
                    }
                    
                    // Draw box
                    if (process.type === 'start' || process.type === 'end') {
                        pdf.setFillColor(process.type === 'start' ? 76 : 244, process.type === 'start' ? 175 : 67, process.type === 'start' ? 80 : 54);
                        pdf.roundedRect(centerX - boxWidth/2, y, boxWidth, boxHeight, 10, 10, 'F');
                    } else if (process.type === 'decision') {
                        pdf.setFillColor(255, 152, 0);
                        pdf.rect(centerX - boxWidth/2, y, boxWidth, boxHeight, 'F');
                    } else {
                        pdf.setFillColor(33, 150, 243);
                        pdf.rect(centerX - boxWidth/2, y, boxWidth, boxHeight, 'F');
                    }
                    
                    // Add text
                    pdf.setFontSize(9);
                    pdf.setTextColor(255, 255, 255);
                    const lines = process.label.split('\n');
                    lines.forEach((line, lineIndex) => {
                        pdf.text(line, centerX, y + 10 + (lineIndex * 5), { align: 'center' });
                    });
                    
                    // Draw arrow to next
                    if (index < this.handbookData.flowchart.processes.length - 1) {
                        pdf.setDrawColor(100, 100, 100);
                        pdf.setLineWidth(0.5);
                        pdf.line(centerX, y + boxHeight, centerX, y + boxHeight + 10);
                        // Arrow head
                        pdf.line(centerX - 3, y + boxHeight + 7, centerX, y + boxHeight + 10);
                        pdf.line(centerX + 3, y + boxHeight + 7, centerX, y + boxHeight + 10);
                    }
                    
                    y += boxHeight + 15;
                });
            }
            
            // Add footer
            pdf.setFontSize(8);
            pdf.setTextColor(128, 128, 128);
            pdf.text(`Generated: ${new Date().toLocaleDateString('id-ID')}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
            
            const fileName = `Flowchart_Manajemen_Risiko_${new Date().toISOString().split('T')[0]}.pdf`;
            pdf.save(fileName);
            
            this.showSuccess(`Flowchart PDF berhasil diunduh: ${fileName}`);
        } catch (error) {
            console.error('Error downloading flowchart PDF:', error);
            this.showError('Gagal mengunduh flowchart PDF: ' + error.message);
        } finally {
            this.hideLoading();
        }
    }

    setupEventListeners() {
        // Close modal when clicking outside
        document.addEventListener('click', (e) => {
            const modal = document.getElementById('flowchart-modal');
            if (e.target === modal) {
                this.closeFlowchart();
            }
        });
        
        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft' && e.ctrlKey) {
                e.preventDefault();
                this.previousChapter();
            } else if (e.key === 'ArrowRight' && e.ctrlKey) {
                e.preventDefault();
                this.nextChapter();
            } else if (e.key === 'Escape') {
                this.closeFlowchart();
            }
        });
    }

    showError(message) {
        // Use existing notification system
        if (window.showError) {
            window.showError(message);
        } else if (window.alert) {
            alert('Error: ' + message);
        } else {
            console.error('Error:', message);
        }
    }

    showSuccess(message) {
        // Use existing notification system
        if (window.showSuccess) {
            window.showSuccess(message);
        } else if (window.alert) {
            alert('Success: ' + message);
        } else {
            console.log('Success:', message);
        }
    }

    showLoading(message = 'Loading...') {
        // Use existing loading system
        if (window.showLoading) {
            window.showLoading(message);
        } else {
            console.log('Loading:', message);
            // Create simple loading indicator
            this.createLoadingIndicator(message);
        }
    }

    hideLoading() {
        // Use existing loading system
        if (window.hideLoading) {
            window.hideLoading();
        } else {
            this.removeLoadingIndicator();
        }
    }

    createLoadingIndicator(message) {
        // Remove existing loading indicator
        this.removeLoadingIndicator();
        
        const loadingDiv = document.createElement('div');
        loadingDiv.id = 'buku-pedoman-loading';
        loadingDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 20px;
            border-radius: 8px;
            z-index: 10000;
            text-align: center;
        `;
        loadingDiv.innerHTML = `
            <div style="margin-bottom: 10px;">
                <div style="border: 3px solid #f3f3f3; border-top: 3px solid #ffffff; border-radius: 50%; width: 30px; height: 30px; animation: spin 1s linear infinite; margin: 0 auto;"></div>
            </div>
            <div>${message}</div>
        `;
        
        // Add CSS animation
        if (!document.getElementById('loading-animation-style')) {
            const style = document.createElement('style');
            style.id = 'loading-animation-style';
            style.textContent = `
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(loadingDiv);
    }

    removeLoadingIndicator() {
        const loadingDiv = document.getElementById('buku-pedoman-loading');
        if (loadingDiv) {
            loadingDiv.remove();
        }
    }
}

// Initialize when page loads
let bukuPedomanManager;

// Function to initialize with proper dependency checking
async function initializeBukuPedoman() {
    try {
        console.log('Initializing Buku Pedoman...');
        
        // Wait for dependencies to be available
        let retries = 0;
        const maxRetries = 10;
        
        while (retries < maxRetries) {
            // Check if container exists
            const container = document.getElementById('buku-pedoman-content');
            if (!container) {
                console.log('Waiting for buku-pedoman-content container...');
                await new Promise(resolve => setTimeout(resolve, 500));
                retries++;
                continue;
            }
            
            // Initialize the manager
            bukuPedomanManager = new BukuPedomanManager();
            window.bukuPedomanManager = bukuPedomanManager;
            console.log('Buku Pedoman initialized successfully');
            return bukuPedomanManager;
        }
        
        throw new Error('Failed to initialize after maximum retries');
        
    } catch (error) {
        console.error('Failed to initialize Buku Pedoman:', error);
        // Create a fallback manager that shows error message
        bukuPedomanManager = {
            showError: (msg) => console.error(msg),
            renderHandbook: () => {
                const container = document.getElementById('buku-pedoman-content');
                if (container) {
                    container.innerHTML = `
                        <div style="padding: 20px; text-align: center; color: #dc3545;">
                            <h3>Error Loading Buku Pedoman</h3>
                            <p>Terjadi kesalahan saat memuat buku pedoman. Silakan refresh halaman atau hubungi administrator.</p>
                            <button onclick="location.reload()" style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
                                Refresh Halaman
                            </button>
                        </div>
                    `;
                }
            }
        };
        window.bukuPedomanManager = bukuPedomanManager;
        return bukuPedomanManager;
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Don't auto-initialize, let the app.js handle it
    console.log('Buku Pedoman script loaded, ready for initialization');
});

// Export initialization function for app.js
window.initializeBukuPedoman = initializeBukuPedoman;

// Export for global access
window.bukuPedomanManager = bukuPedomanManager;