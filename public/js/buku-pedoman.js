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
                description: "Diagram alur proses bisnis manajemen risiko terintegrasi",
                processes: [
                    {
                        id: "start",
                        type: "start",
                        label: "Mulai",
                        x: 50,
                        y: 50
                    },
                    {
                        id: "strategic_planning",
                        type: "process",
                        label: "Perencanaan Strategis\n(Visi, Misi, SWOT, Strategic Map)",
                        x: 50,
                        y: 150
                    },
                    {
                        id: "risk_identification",
                        type: "process", 
                        label: "Identifikasi Risiko\n(Risk Register, Kategorisasi)",
                        x: 50,
                        y: 250
                    },
                    {
                        id: "end",
                        type: "end",
                        label: "Selesai",
                        x: 50,
                        y: 350
                    }
                ],
                connections: [
                    { from: "start", to: "strategic_planning" },
                    { from: "strategic_planning", to: "risk_identification" },
                    { from: "risk_identification", to: "end" }
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
        const flowchart = this.handbookData.flowchart;
        
        return `
            <div class="flowchart-svg-container">
                <svg width="800" height="800" viewBox="0 0 800 800" class="flowchart-svg">
                    <!-- Background -->
                    <defs>
                        <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e0e0e0" stroke-width="1"/>
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
                    </defs>
                    
                    <rect width="100%" height="100%" fill="url(#grid)" />
                    
                    <!-- Process Nodes -->
                    ${flowchart.processes.map(process => this.renderFlowchartNode(process)).join('')}
                    
                    <!-- Connections -->
                    ${flowchart.connections.map(conn => this.renderFlowchartConnection(conn, flowchart.processes)).join('')}
                </svg>
            </div>
            
            <!-- Legend -->
            <div class="flowchart-legend">
                <h4>Keterangan:</h4>
                <div class="legend-items">
                    <div class="legend-item">
                        <div class="legend-symbol start"></div>
                        <span>Mulai/Selesai</span>
                    </div>
                    <div class="legend-item">
                        <div class="legend-symbol process"></div>
                        <span>Proses</span>
                    </div>
                    <div class="legend-item">
                        <div class="legend-symbol decision"></div>
                        <span>Keputusan</span>
                    </div>
                    <div class="legend-item">
                        <div class="legend-symbol connection"></div>
                        <span>Alur Proses</span>
                    </div>
                </div>
            </div>
        `;
    }

    renderFlowchartNode(process) {
        const x = process.x * 6; // Scale up coordinates
        const y = process.y * 6;
        
        let shape = '';
        let fill = '';
        
        switch (process.type) {
            case 'start':
            case 'end':
                shape = `<ellipse cx="${x}" cy="${y}" rx="60" ry="30" fill="url(#${process.type === 'start' ? 'start' : 'end'}Gradient)" stroke="#333" stroke-width="2"/>`;
                break;
            case 'process':
                shape = `<rect x="${x-70}" y="${y-25}" width="140" height="50" rx="5" fill="url(#processGradient)" stroke="#333" stroke-width="2"/>`;
                break;
            case 'decision':
                shape = `<polygon points="${x},${y-30} ${x+50},${y} ${x},${y+30} ${x-50},${y}" fill="url(#decisionGradient)" stroke="#333" stroke-width="2"/>`;
                break;
        }
        
        // Text
        const lines = process.label.split('\n');
        const textElements = lines.map((line, index) => 
            `<text x="${x}" y="${y + (index - lines.length/2 + 0.5) * 12}" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" fill="white" font-weight="bold">${line}</text>`
        ).join('');
        
        return `
            <g class="flowchart-node" data-id="${process.id}">
                ${shape}
                ${textElements}
            </g>
        `;
    }

    renderFlowchartConnection(connection, processes) {
        const fromProcess = processes.find(p => p.id === connection.from);
        const toProcess = processes.find(p => p.id === connection.to);
        
        if (!fromProcess || !toProcess) return '';
        
        const x1 = fromProcess.x * 6;
        const y1 = fromProcess.y * 6;
        const x2 = toProcess.x * 6;
        const y2 = toProcess.y * 6;
        
        // Calculate arrow position
        const angle = Math.atan2(y2 - y1, x2 - x1);
        const arrowLength = 10;
        const arrowAngle = Math.PI / 6;
        
        const arrowX1 = x2 - arrowLength * Math.cos(angle - arrowAngle);
        const arrowY1 = y2 - arrowLength * Math.sin(angle - arrowAngle);
        const arrowX2 = x2 - arrowLength * Math.cos(angle + arrowAngle);
        const arrowY2 = y2 - arrowLength * Math.sin(angle + arrowAngle);
        
        // Label position
        const labelX = (x1 + x2) / 2;
        const labelY = (y1 + y2) / 2 - 5;
        
        return `
            <g class="flowchart-connection">
                <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#333" stroke-width="2" marker-end="url(#arrowhead)"/>
                <polygon points="${x2},${y2} ${arrowX1},${arrowY1} ${arrowX2},${arrowY2}" fill="#333"/>
                ${connection.label ? `<text x="${labelX}" y="${labelY}" text-anchor="middle" font-family="Arial, sans-serif" font-size="9" fill="#666" font-weight="bold">${connection.label}</text>` : ''}
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
        const modal = document.getElementById('flowchart-modal');
        if (modal) {
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    }

    closeFlowchart() {
        const modal = document.getElementById('flowchart-modal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }

    async downloadPDF() {
        try {
            this.showLoading('Generating PDF...');
            
            // Try to use apiService first, fallback to direct fetch
            let response;
            if (window.apiService) {
                try {
                    response = await window.apiService.get('/api/buku-pedoman/pdf');
                } catch (error) {
                    console.warn('apiService failed, using direct fetch:', error);
                    response = await this.downloadPDFDirect();
                }
            } else {
                response = await this.downloadPDFDirect();
            }
            
            if (response && response.success) {
                // Create a temporary link to download the PDF
                const link = document.createElement('a');
                link.href = response.downloadUrl || '#';
                link.download = `Buku_Pedoman_Manajemen_Risiko_${new Date().toISOString().split('T')[0]}.pdf`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                this.showSuccess('PDF berhasil diunduh');
            } else {
                // Generate PDF using client-side method
                await this.generateClientSidePDF();
            }
        } catch (error) {
            console.error('Error downloading PDF:', error);
            // Fallback to client-side PDF generation
            try {
                await this.generateClientSidePDF();
            } catch (fallbackError) {
                console.error('Client-side PDF generation failed:', fallbackError);
                this.showError('Gagal mengunduh PDF. Silakan coba lagi atau gunakan fungsi print.');
            }
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
            this.showLoading('Generating PDF using client-side method...');
            
            // Check if jsPDF is available
            if (typeof window.jspdf === 'undefined') {
                throw new Error('jsPDF library not available');
            }

            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF('p', 'mm', 'a4');
            
            // Add title page
            pdf.setFontSize(20);
            pdf.text('Buku Pedoman Sistem Manajemen Risiko', 20, 30);
            pdf.setFontSize(16);
            pdf.text('Berdasarkan ISO 31000:2018', 20, 45);
            pdf.setFontSize(12);
            pdf.text('Penulis: MUKHSIN HADI, SE, M.Si, CGAA, CPFRM, CSEP, CRP, CPRM, CSCAP, CPAB', 20, 60);
            pdf.text(`Tanggal: ${new Date().toLocaleDateString('id-ID')}`, 20, 75);
            
            // Add content from handbook data
            if (this.handbookData && this.handbookData.chapters) {
                let yPosition = 100;
                
                this.handbookData.chapters.forEach((chapter, chapterIndex) => {
                    // Check if we need a new page
                    if (yPosition > 250) {
                        pdf.addPage();
                        yPosition = 20;
                    }
                    
                    // Add chapter title
                    pdf.setFontSize(16);
                    pdf.text(`Bab ${chapter.id}: ${chapter.title}`, 20, yPosition);
                    yPosition += 15;
                    
                    // Add sections
                    if (chapter.sections) {
                        chapter.sections.forEach(section => {
                            if (yPosition > 270) {
                                pdf.addPage();
                                yPosition = 20;
                            }
                            
                            pdf.setFontSize(14);
                            pdf.text(`${section.id} ${section.title}`, 20, yPosition);
                            yPosition += 10;
                            
                            // Add content (simplified)
                            pdf.setFontSize(10);
                            const lines = pdf.splitTextToSize(section.content, 170);
                            lines.forEach(line => {
                                if (yPosition > 280) {
                                    pdf.addPage();
                                    yPosition = 20;
                                }
                                pdf.text(line, 20, yPosition);
                                yPosition += 5;
                            });
                            yPosition += 5;
                        });
                    }
                });
            }
            
            // Save the PDF
            pdf.save(`Buku_Pedoman_Manajemen_Risiko_${new Date().toISOString().split('T')[0]}.pdf`);
            this.showSuccess('PDF berhasil diunduh menggunakan client-side generation');
            
        } catch (error) {
            console.error('Client-side PDF generation failed:', error);
            throw error;
        }
    }

    printHandbook() {
        // Create a print-friendly version
        // Use iframe for printing instead of opening new window
        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = 'none';
        document.body.appendChild(iframe);
        
        const printContent = this.generatePrintContent();
        
        iframe.onload = function() {
            const printWindow = iframe.contentWindow;
            printWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>${this.handbookData.title}</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
                        .print-header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
                        .chapter { page-break-before: always; margin-bottom: 30px; }
                        .chapter:first-child { page-break-before: auto; }
                        .chapter-title { color: #333; border-bottom: 1px solid #ccc; padding-bottom: 10px; }
                        .section { margin: 20px 0; }
                    .section-title { color: #555; margin: 15px 0 10px 0; }
                    .section-content { margin-left: 20px; }
                    @media print {
                        body { margin: 0; }
                        .chapter { page-break-before: always; }
                    }
                </style>
            </head>
            <body>
                ${printContent}
            </body>
            </html>
                `);
                
                printWindow.document.close();
                
                // Wait a bit for content to load, then print
                setTimeout(() => {
                    printWindow.print();
                    
                    // Remove iframe after printing
                    setTimeout(() => {
                        if (iframe.parentNode) {
                            document.body.removeChild(iframe);
                        }
                    }, 1000);
                }, 500);
            }.bind(this);
            
            iframe.src = 'about:blank';
    }

    generatePrintContent() {
        return `
            <div class="print-header">
                <h1>${this.handbookData.title}</h1>
                <h2>${this.handbookData.subtitle}</h2>
                <p><strong>Penulis & Pengembang:</strong> ${this.handbookData.author}</p>
                <p><strong>Versi:</strong> ${this.handbookData.version} | <strong>Tanggal:</strong> ${new Date(this.handbookData.date).toLocaleDateString('id-ID')}</p>
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
        `;
    }

    async downloadFlowchartPDF() {
        try {
            showLoading('Generating flowchart PDF...');
            
            // Use html2canvas to capture the flowchart
            const flowchartContainer = document.getElementById('flowchart-container');
            const canvas = await html2canvas(flowchartContainer, {
                scale: 2,
                backgroundColor: '#ffffff'
            });
            
            // Create PDF with jsPDF
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF('l', 'mm', 'a4'); // Landscape orientation
            
            const imgWidth = 297; // A4 landscape width in mm
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            
            pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, imgWidth, imgHeight);
            pdf.save(`Flowchart_Manajemen_Risiko_${new Date().toISOString().split('T')[0]}.pdf`);
            
            showSuccess('Flowchart PDF berhasil diunduh');
        } catch (error) {
            console.error('Error downloading flowchart PDF:', error);
            showError('Gagal mengunduh flowchart PDF');
        } finally {
            hideLoading();
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
                <div style="border: 3px solid #f3f3f3; border-top: 3px solid #667eea; border-radius: 50%; width: 30px; height: 30px; animation: spin 1s linear infinite; margin: 0 auto;"></div>
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