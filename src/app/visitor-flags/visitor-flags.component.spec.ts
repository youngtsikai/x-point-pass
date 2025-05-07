import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VisitorFlagsComponent } from './visitor-flags.component';

describe('VisitorFlagsComponent', () => {
  let component: VisitorFlagsComponent;
  let fixture: ComponentFixture<VisitorFlagsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VisitorFlagsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VisitorFlagsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
